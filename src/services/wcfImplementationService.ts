import type { GeneratorData } from "../types/dtos";
import tmpl from "../templates/wcfImplementation.vb.tmpl?raw";
import { mapSqlTypeToVBType, sanitizeIdentifier } from "./vbHelpers";

export function generateWcfImplementationFragment(data: GeneratorData): { title: string; filename: string; content: string; description: string } {
  const rawTable = data.tableName ?? "MyTable";
  const varName = rawTable; 

  // CLASS_BASE en Pascal (CodigoAccion)
  const classBase = rawTable
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const regClassName = `TReg${classBase}`;

  // PK columns
  const pkCols = (data.attributes ?? []).filter(a => !!a.isPrimary);

  // PK params signature: ", ByVal pEmp_id As Integer, ByVal pAccion_id As Integer"
  const pkParamsParts = pkCols.map(c => {
    const col = c.columnName ?? c.name;
    const vbType = mapSqlTypeToVBType(c.type);
    return `ByVal p${col} As ${vbType}`;
  });
  const pkParamsSignature = pkParamsParts.length > 0 ? `, ${pkParamsParts.join(", ")}` : "";

  // PK args list for calls: ", pEmp_id, pAccion_id" (leading comma if any)
  const pkArgNames = pkCols.map(c => `p${(c.columnName ?? c.name)}`);
  const pkArgsList = pkArgNames.length > 0 ? `, ${pkArgNames.join(", ")}` : "";

  // Determine selected category/class to call. Default to "Catalogo"
  const rawCategory = (data.category ?? "Catalogo").toString();
  const selectedBase = rawCategory.replace(/^T/i, "").replace(/\.vb$/i, "").replace(/[^A-Za-z0-9]/g, "");
  const callerVar = selectedBase || "Catalogo";        
  const callerClass = `T${selectedBase || "Catalogo"}`; 

  let content = tmpl
    .replace(/{{VAR_NAME}}/g, varName)
    .replace(/{{CLASS_BASE}}/g, classBase)
    .replace(/{{REG_CLASS_NAME}}/g, regClassName)
    .replace(/{{PK_PARAMS_SIGNATURE}}/g, pkParamsSignature)
    .replace(/{{PK_ARGS_LIST}}/g, pkArgsList);

  // Replace the hardcoded "Catalogo" and "TCatalogo" in the template with the selected caller names.
  // Use word-boundary regex to avoid accidental partial replacements.
  const reCatalogo = /\bCatalogo\b/g;
  const reTCatalogo = /\bTCatalogo\b/g;
  content = content.replace(reTCatalogo, callerClass).replace(reCatalogo, callerVar);

  const filename = `${sanitizeIdentifier(rawTable)}_ImplWCF.txt`;
  const title = `Fragmento WCF Implementation - ${classBase}`;
  const description = "Fragmento de código que expone los endpoints en la capa de presentación. Pegar en 'ServiciosWCF/WCF"+data.category+ "'.";

  return { title, filename, content, description};
}
