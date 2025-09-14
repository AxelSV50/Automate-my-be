import type { GeneratorData } from "../types/dtos";
import interfaceTemplate from "../templates/interfaceIWCF.vb.tmpl?raw";
import { mapSqlTypeToVBType } from "./vbHelpers";
import { sanitizeIdentifier } from "./vbHelpers";

export function generateInterfaceIWCFFragment(data: GeneratorData): { title: string; filename: string; content: string; description: string } {
  const rawTable = data.tableName ?? "MyTable";
  // VAR_NAME mantiene el nombre original (Codigo_Accion)
  const varName = rawTable;
  // REG_CLASS_NAME: TReg + Camel/Pascal de la tabla para el tipo de datos
  const classBase = rawTable
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const regClassName = `TReg${classBase}`;

  // PK columns
  const pkCols = (data.attributes ?? []).filter(a => !!a.isPrimary);

  // Construir PK params signature: ", ByVal pEmp_id As Integer, ByVal pAccion_id As Integer"
  const pkParamsParts = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    const vbType = mapSqlTypeToVBType(c.type);
    return `ByVal p${col} As ${vbType}`;
  });
  const pkParamsSignature = pkParamsParts.length > 0 ? `, ${pkParamsParts.join(", ")}` : "";

  const content = interfaceTemplate
    .replace(/{{VAR_NAME}}/g, varName)
    .replace(/{{REG_CLASS_NAME}}/g, regClassName)
    .replace(/{{PK_PARAMS_SIGNATURE}}/g, pkParamsSignature);

  const filename = `${sanitizeIdentifier(rawTable)}_InterfaceIWCF.txt`;
  const title = `Fragmento Interface IWCF - ${classBase}`;

  const description = "Fragmento de código a colocar en la interface IWCF. Pegar en 'ServiciosWCF/IWCF"+data.category+ "'.";

  return { title, filename, content, description };
}
