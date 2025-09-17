export function sanitizeIdentifier(s: string): string {
  if (!s) return s;
  //Trim, reemplazar espacios por _, eliminar caracteres distintos de letra/dígito/_ 
  // conservar mayusculas/minusculas
  let out = s.trim().replace(/\s+/g, "_").replace(/[^\w]/g, "");

  //Evitar que empiece con dígito
  if (/^\d/.test(out)) out = "F_" + out;
  if (out.length === 0) out = "_";
  return out;
}

export function privateVarName(attrName: string): string {
  const base = sanitizeIdentifier(attrName);
  return base.startsWith("_") ? base : `_${base}`;
}

export function mapSqlTypeToVBType(sqlType: string | undefined | null): string {
  const raw = (sqlType ?? "").toLowerCase().trim();
  const bare = raw.replace(/\(.*\)/, "").trim(); 

  // Enteros
  if (bare === "tinyint" || bare === "smallint" || bare === "int" || bare === "integer") return "Integer";
  if (bare === "bigint") return "Long";

  // Decimales / numeric
  if (bare.includes("decimal") || bare.includes("numeric")) return "Decimal";

  // Flotantes
  if (bare.includes("float") || bare.includes("double") || bare === "real") return "Double";

  // Texto / cadenas
  if (bare.includes("char") || bare.includes("text") || bare.includes("varchar") || bare.includes("nvarchar")) return "String";

  // Fecha / tiempo
  if (bare.includes("date") || bare.includes("time")) return "DateTime";

  // Booleanos / bit
  if (bare === "bit" || bare.includes("bool")) return "Boolean";

  // Fallback: String
  return "String";
}

export function defaultValueForVB(vbType: string): string {
  const t = (vbType ?? "").trim().toLowerCase();
  switch (t) {
    case "integer":
    case "long":
      return "0";
    case "decimal":
      return "0D";
    case "double":
      return "0D";
    case "boolean":
      return "False";
    case "datetime":
      return `CDate("1900/01/01")`;
    case "string":
    default:
      return `""`;
  }
}
