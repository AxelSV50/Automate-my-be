// src/types/dtos.ts
export interface Attribute {
  id: string;
  name: string;        // propiedad / identificador que se usará en el código (p.ej. Accion_Descripcion)
  type: string;        // tipo SQL (varchar(50), int, float, ...)
  nullable?: boolean;
  isPrimary?: boolean; // forma parte de la PK
  isIdentity?: boolean;// columna identity/autoincrement
  columnName?: string; // nombre real de columna en BD (si quieres distinto a `name`)
}

export interface GeneratorData {
  tableName: string;
  attributes: Attribute[];
  namespace?: string;
  category?: string; 
}
