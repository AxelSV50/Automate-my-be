import type { GeneratorData } from "../types/dtos";
import controlBusinessTemplate from "../templates/controlBusiness.vb.tmpl?raw";
import { mapSqlTypeToVBType } from "./vbHelpers";

/**
 * Genera un fragmento para la capa de negocio (ControlBusiness).
 * Devuelve un objeto con { title, filename, content }.
 * Filename es .txt (descarga) pero el contenido es VB.
 */
export function generateControlBusinessFragment(data: GeneratorData): { title: string; filename: string; content: string } {
  const rawTable = data.tableName ?? "MyTable";
  // CLASS_BASE: PascalCase sin guiones bajos (Codigo_Accion -> CodigoAccion)
  const classBase = rawTable
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const regClassName = `TReg${classBase}`; // TRegCodigoAccion
  const varName = rawTable; // mantener el nombre original con underscore como variable (ej: Codigo_Accion)

  // PK columns (ordenados en el array como vienen)
  const pkCols = (data.attributes ?? []).filter(a => !!a.isPrimary);

  // Construir PK params signature: ", ByVal pEmp_id As Integer, ByVal pAccion_id As Integer"
  const pkParamsParts = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    const vbType = mapSqlTypeToVBType(c.type);
    return `ByVal p${col} As ${vbType}`;
  });
  const pkParamsSignature = pkParamsParts.length > 0 ? `, ${pkParamsParts.join(", ")}` : "";

  // Construir PK assignments to variable (with 12 spaces indent)
  // Example:             Codigo_Accion.Col.Emp_Id = pEmp_id
  const pkAssignments = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    return `            ${varName}.Col.${col} = p${col}`;
  }).join("\n");

  // Replace tokens in template
  const content = controlBusinessTemplate
    .replace(/{{CLASS_BASE}}/g, classBase)
    .replace(/{{REG_CLASS_NAME}}/g, regClassName)
    .replace(/{{VAR_NAME}}/g, varName)
    .replace(/{{PK_PARAMS_SIGNATURE}}/g, pkParamsSignature)
    .replace(/{{PK_ASSIGNMENTS_VAR}}/g, pkAssignments);

  const title = `Fragmento para capa de negocio "ControlBusiness" - ${classBase}`;
  const filename = `${classBase}_ControlBusiness.txt`; // .txt para descarga simple

  return { title, filename, content };
}
