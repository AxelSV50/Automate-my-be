import type { GeneratorData } from "../../types/dtos";
import tmpl from "../../templates/wcfImplementation.vb.tmpl?raw";
import { mapSqlTypeToVBType, sanitizeIdentifier } from "../vbHelpers";

export function generateWcfImplementationFragment(data: GeneratorData): { title: string; filename: string; content: string; description: string } {
  const rawTable = data.tableName ?? "MyTable";
  const varName = rawTable; // mantiene underscore

  // CLASS_BASE en Pascal 
  const classBase = rawTable
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const regClassName = `TReg${classBase}`;

  // PKs
  const pkCols = (data.attributes ?? []).filter(a => !!a.isPrimary);

  // ARGS CONEXION
  const pkParamsParts = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    const vbType = mapSqlTypeToVBType(c.type);
    return `ByVal p${col} As ${vbType}`;
  });
  const pkParamsSignature = pkParamsParts.length > 0 ? `, ${pkParamsParts.join(", ")}` : "";

  // ARGUMENTOS: ", pEmp_id, pAccion_id"
  const pkArgNames = pkCols.map(c => `p${(c.columnName ?? c.name)}`);
  const pkArgsList = pkArgNames.length > 0 ? `, ${pkArgNames.join(", ")}` : "";

  // DETERMINAR LA CATEGORÍA
  const rawCategory = (data.category ?? "Catalogo").toString();
  const selectedBase = rawCategory.replace(/^T/i, "").replace(/\.vb$/i, "").replace(/[^A-Za-z0-9]/g, "");
  const callerBase = selectedBase || "Catalogo";              
  const callerVar = callerBase;                              
  const callerClass = `T${callerBase}`;                       
  const interfaceName = `IWCF${callerBase}`;                

  // REEMPLAZAR LOS TOKENS
  let content = tmpl
    .replace(/{{VAR_NAME}}/g, varName)
    .replace(/{{CLASS_BASE}}/g, classBase)
    .replace(/{{REG_CLASS_NAME}}/g, regClassName)
    .replace(/{{PK_PARAMS_SIGNATURE}}/g, pkParamsSignature)
    .replace(/{{PK_ARGS_LIST}}/g, pkArgsList)
    .replace(/{{CALLER_VAR}}/g, callerVar)
    .replace(/{{CALLER_CLASS}}/g, callerClass)
    .replace(/{{INTERFACE_NAME}}/g, interfaceName);

  const filename = `${sanitizeIdentifier(rawTable)}_ImplWCF.txt`;
  const title = `Fragmento WCF Implementation - ${classBase}`;
  const description = `Fragmento de código que expone los endpoints en la capa de presentación. Pegar en 'ServiciosWCF/WCF${callerBase}'.`;

  return { title, filename, content, description };
}
