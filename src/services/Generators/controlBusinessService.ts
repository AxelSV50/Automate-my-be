import type { GeneratorData } from "../../types/dtos";
import controlBusinessTemplate from "../../templates/controlBusiness.vb.tmpl?raw";
import { mapSqlTypeToVBType } from "../vbHelpers";


export function generateControlBusinessFragment(data: GeneratorData): { title: string; filename: string; content: string; description: string} {
  const rawTable = data.tableName ?? "MyTable";
  // CLASS_BASE: PascalCase sin guiones bajos (Codigo_Accion -> CodigoAccion)
  const classBase = rawTable
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const regClassName = `TReg${classBase}`; 
  const varName = rawTable; 
  const pkCols = (data.attributes ?? []).filter(a => !!a.isPrimary);

  const pkParamsParts = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    const vbType = mapSqlTypeToVBType(c.type);
    return `ByVal p${col} As ${vbType}`;
  });
  const pkParamsSignature = pkParamsParts.length > 0 ? `, ${pkParamsParts.join(", ")}` : "";

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
  const filename = `${classBase}_ControlBusiness.txt`; 
  const description = "Fragmento de código para la lógica de negocio. Pegar en 'ControlBusiness/T"+data.category+ "'.";

  return { title, filename, content, description };
}
