import type { GeneratorData } from "../types/dtos";
import managerTemplate from "../templates/manager.vb.tmpl?raw";
import { sanitizeIdentifier } from "./vbHelpers";

export function generateManagerFile(data: GeneratorData): { filename: string; content: string; description: string } {
  const tableName = data.tableName;
  const className = sanitizeIdentifier("T" + tableName.replace(/\s+/g, ""));
  const cols = data.attributes.map(a => ({ ...a, columnName: a.columnName ?? a.name }));

  // VARIABLES (private)
  const variables = `    Private _Cols As ${"TReg" + sanitizeIdentifier(tableName)}`;

  // CONSTRUCTOR INITS
  const constructorInits = `        _Cols = New TReg${sanitizeIdentifier(tableName)}`;

  // PROPERTIES (Col property)
  const properties = `    Public Property Col() As TReg${sanitizeIdentifier(tableName)}\n        Get\n            Return _Cols\n        End Get\n        Set(ByVal Value As TReg${sanitizeIdentifier(tableName)})\n            _Cols = Value\n        End Set\n    End Property`;

  // INSERT LINES: Into("ColName", New TValue(_Cols.Property))
  const insertLines = cols.map(c => {

    if (c.isIdentity) {
      return `            _Insert.Into("${c.columnName}", New TValue(GetNext_Identity))`;
    } else {
      return `            _Insert.Into("${c.columnName}", New TValue(_Cols.${c.name}))`;
    }
  }).join("\n");

  // UPDATE SET lines (skip identity and skip PK fields)
  const nonPkNonIdentity = cols.filter(c => !c.isPrimary && !c.isIdentity);
  const updateSetLines = nonPkNonIdentity.map(c => `            _Update.SetValue("${c.columnName}", New TValue(_Cols.${c.name}))`).join("\n");

  // WHERE PK lines for Update/Delete/ListKey: for composite, multiple Where() calls
  const pkCols = cols.filter(c => c.isPrimary);
  const wherePkLinesUpdate = pkCols.map(c => `            _Update.Where(New TField("${c.columnName}"), OperadoresFiltros.Igual, New TValue(_Cols.${c.name}))`).join("\n");
  const wherePkLinesDelete = pkCols.map(c => `            _Delete.Where(New TField("${c.columnName}"), OperadoresFiltros.Igual, New TValue(_Cols.${c.name}))`).join("\n");
  const wherePkLinesListKey = pkCols.map(c => `            _Query.Where(New TField("A", "${c.columnName}"), OperadoresFiltros.Igual, New TValue(_Cols.${c.name}))`).join("\n");

  const selectListKeyFields = cols.map(c => `            _Query.Selected(New TField("A", "${c.columnName}"))`).join("\n");
  const defaultOrderField = (() => {
    const candidate = cols.find(c => c.isPrimary) ?? cols[0];
    return candidate ? candidate.columnName : cols[0].columnName;
  })();
 const selectListFields = (() => {

  const idField = cols.find(c => c.isPrimary && !c.isIdentity) ?? cols.find(c => c.isPrimary) ?? cols[0];
  const otherFields = cols.filter(c => c.columnName !== (idField?.columnName ?? ""));
  const lines: string[] = [];

  if (idField) {
    lines.push(`            _Query.Selected(New TField("A", "${idField.columnName}", "${idField.columnName}"))`);
  }

  otherFields.forEach(of => {
    lines.push(`            _Query.Selected(New TField("A", "${of.columnName}", "${of.columnName}"))`);
  });

  return lines.join("\n");
})();

const firstNonIdentityPk = (pkCols.find(c => !c.isIdentity) ?? pkCols[0] ?? cols[0]);
const identityPk = (pkCols.find(c => c.isIdentity) ?? pkCols[0] ?? cols[0]);
const textCol = (cols.find(c => /char|text|varchar|nvarchar/i.test(c.type)) ?? firstNonIdentityPk ?? cols[0]);

const hasMultiplePK = (pkCols.length > 1);

let listWhereExample = "";

if (hasMultiplePK) {
  // Cuando hay más de una PK
  listWhereExample = `
            _Query.Where(New TField("A", "${firstNonIdentityPk.columnName}"), OperadoresFiltros.Igual, New TValue(Param.Empresa))
            If Param.TipoFiltro = TParam.Nombre Then 'Por Nombre
                _Query.Where(New TField("A", "${textCol.columnName}"), OperadoresFiltros.Parecido, New TConjunto(Param.Nombre))
            ElseIf Param.TipoFiltro = TParam.Codigo Then 'Por Codigo
                _Query.Where(New TField("A", "${identityPk.columnName}"), OperadoresFiltros.Igual, New TValue(Param.Id))
            End If`;
} else {
  //Cuando sólo hay una PK no tiene sentido la condición inicial ni el filtro por Código
  listWhereExample = `
            If Param.TipoFiltro = TParam.Nombre Then 'Por Nombre
                _Query.Where(New TField("A", "${textCol.columnName}"), OperadoresFiltros.Parecido, New TConjunto(Param.Nombre))
            End If`;
}

  // RECORD_LOAD lines: _Cols.Prop = .Item("ColName")
  const recordLoadLines = cols.map(c => `            _Cols.${c.name} = .Item("${c.columnName}")`).join("\n");

  // GET_NEXT_IDENTITY: if there's any identity column, produce the logic similar to example: Max(identity) filtered by other PKs
  const identityCol = cols.find(c => c.isIdentity);
  let getNextIdentitySnippet = `        ' No identity column defined - adjust if needed\n        Return 1`;
  if (identityCol) {
    // build where clauses: for each pk except identityCol itself, add Where(New TField("A","col"),..., New TValue(_Cols.col))
    const otherPkCols = cols.filter(c => c.isPrimary && c.columnName !== identityCol.columnName);
    const whereLines = otherPkCols.map(c => `        _Query.Where(New TField("A", "${c.columnName}"), OperadoresFiltros.Igual, New TValue(_Cols.${c.name}))`).join("\n");
    getNextIdentitySnippet = `        Dim _Query As New TQuery(_Transaccion.Conexion)
        _Query.Selected(New TMax(New TField("A", "${identityCol.columnName}"), "Maximo"))
        _Query.From(New TFrom("${tableName}", "A"))
${whereLines ? whereLines + "\n" : ""}        If _Query.Open Then
            If IsDBNull(_Query.Data.Rows(0).Item("Maximo")) Then
                Return 1
            Else
                Return _Query.Data.Rows(0).Item("Maximo") + 1
            End If
        Else
            Return 1
        End If`;
  }

  // Compose final content by replacing tokens
  const content = managerTemplate
    .replace(/{{TABLE_NAME}}/g, tableName)
    .replace(/{{CLASS_NAME}}/g, className)
    .replace("{{VARIABLES}}", variables)
    .replace("{{CONSTRUCTOR_INITS}}", constructorInits)
    .replace("{{PROPERTIES}}", properties)
    .replace("{{INSERT_LINES}}", insertLines)
    .replace("{{UPDATE_SET_LINES}}", updateSetLines)
    .replace("{{WHERE_PK_LINES_UPDATE}}", wherePkLinesUpdate)
    .replace("{{WHERE_PK_LINES_DELETE}}", wherePkLinesDelete)
    .replace("{{WHERE_PK_LINES_LISTKEY}}", wherePkLinesListKey)
    .replace("{{SELECT_LISTKEY_FIELDS}}", selectListKeyFields)
    .replace("{{SELECT_LIST_FIELDS}}", selectListFields)
    .replace("{{LIST_WHERE_EXAMPLE}}", listWhereExample)
    .replace("{{DEFAULT_ORDER_FIELD}}", defaultOrderField)
    .replace("{{RECORD_LOAD_LINES}}", recordLoadLines)
    .replace("{{GET_NEXT_IDENTITY}}", getNextIdentitySnippet);

    const description = "Clase de DAL que se comunica con la Base de Datos. Colocar archivo en proyecto "+ "'"+data.category+ "'.";

  return {
    filename: `${className}.vb`,
    content,
    description
  };
}
