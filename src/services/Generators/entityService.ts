import {
  sanitizeIdentifier,
  privateVarName,
  mapSqlTypeToVBType,
  defaultValueForVB
} from "../vbHelpers";
import entityTemplate from "../../templates/entity.vb.tmpl?raw";
import type { GeneratorData } from "../../types/dtos";

export function generateEntityFile(data: GeneratorData): { filename: string; content: string, description: string } {
  const tableName = sanitizeIdentifier(data.tableName);
  const className = `TReg${tableName}`;
  const attrs = data.attributes.map(a => ({ ...a }));

  const VARIABLES = attrs.length > 0
    ? attrs.map(a => `    Private ${privateVarName(a.name)} As ${mapSqlTypeToVBType(a.type)}`).join("\n")
    : "    ' No attributes defined";

  const PROPERTIES = attrs.length > 0
    ? attrs.map(a => {
        const propName = sanitizeIdentifier(a.name);
        const pv = privateVarName(a.name);
        const vbType = mapSqlTypeToVBType(a.type);
        return [
`    Public Property ${propName}() As ${vbType}`,
`        Get`,
`            Return ${pv}`,
`        End Get`,
`        Set(ByVal Value As ${vbType})`,
`            ${pv} = Value`,
`        End Set`,
`    End Property`,
``
        ].join("\n");
      }).join("\n")
    : "    ' No properties defined";

  const INITIALIZATIONS = attrs.length > 0
    ? attrs.map(a => {
        const pv = privateVarName(a.name);
        const vbType = mapSqlTypeToVBType(a.type);
        const def = defaultValueForVB(vbType);
        return `        ${pv} = ${def}`;
      }).join("\n")
    : "        ' Nothing to initialize";

  const content = entityTemplate
    .replace(/{{TableName}}/g, className)
    .replace("{{VARIABLES}}", VARIABLES)
    .replace("{{PROPERTIES}}", PROPERTIES)
    .replace("{{INITIALIZATIONS}}", INITIALIZATIONS);

  const description = "Entidad que representa a la tabla SQL en el backend. Colocar archivo en 'AccesoTablas/" + data.category+"'.";

  return {
    filename: `${className}.vb`,
    content,
    description
  };
}
