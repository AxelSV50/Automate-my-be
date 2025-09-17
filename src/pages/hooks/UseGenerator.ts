import { useState } from "react";
import { toast } from "react-toastify";
import type { Attribute, GeneratorData } from "../../types/dtos";
import { generateFiles } from "../../services/templateService";

export const COMMON_SQL_TYPES = [
  "int", "bigint", "smallint", "decimal", "numeric", "float",
  "varchar", "nvarchar", "text", "datetime", "date", "bit"
];

export const CATEGORIES = [
  "Catalogo",
  "Bancos",
  "Compras",
  "Comunicacion",
  "Contabilidad",
  "ControlBusiness",
  "Credito",
  "CuentasXCobrar",
  "CuentasXPagar",
  "DeduccionAutomatica",
  "Facturacion",
  "FacturaElectronica",
  "Historico",
  "Imagenes",
  "Interfaces",
  "Inventario",
  "PreVentas",
  "Report",
  "SAP",
  "Seguridad",
  "ServicioImportacion",
  "Sincronizacion"
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sanitizeColumnName(s: string) {
  return s.trim().replace(/\s+/g, "_");
}

export type GeneratedUnit = { filename: string; content: string; title?: string; description?: string };

export function useGenerator() {
  const [tableName, setTableName] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<string>(COMMON_SQL_TYPES[0]);
  const [newIsPrimary, setNewIsPrimary] = useState<boolean>(false);
  const [newIsIdentity, setNewIsIdentity] = useState<boolean>(false);
  const [generated, setGenerated] = useState<GeneratedUnit[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0] ?? "Catalogo");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  /* ---------- VALIDACIONES AL AGREGAR ATRIBUTOS---------- */
  const addAttribute = () => {
    const raw = newAttrName.trim();
    if (!raw) {
      toast.warn("El nombre del atributo no puede estar vacío");
      return;
    }

    const sanitized = sanitizeColumnName(raw);

    // NOMBRE ÚNICO:
    const exists = attributes.some(a => a.name.toLowerCase() === sanitized.toLowerCase());
    if (exists) {
      toast.error(`Ya existe un atributo con nombre "${sanitized}"`);
      return;
    }

    // VALIDACIONES PARA IDENTITY:
    // Si pidio Identity, debe ser PK
    if (newIsIdentity && !newIsPrimary) {
      toast.error("No se puede marcar Identity en una columna que no es PK. Marque primero PK.");
      return;
    }
    // Si pidio Identity, el tipo debe ser entero
    const integerTypes = ["int", "bigint", "smallint"];
    if (newIsIdentity && !integerTypes.includes(newAttrType.toLowerCase())) {
      toast.error("Identity sólo permitido para tipos enteros: int, bigint, smallint.");
      return;
    }

    //SOLO UN IDENTITY, se desmarca lo anterior
    const updated = newIsIdentity ? attributes.map(a => ({ ...a, isIdentity: false })) : [...attributes];

    const newAttr: Attribute = {
      id: uid(),
      name: sanitized,
      type: newAttrType,
      nullable: false,
      isPrimary: newIsPrimary,
      isIdentity: newIsIdentity,
      columnName: sanitized
    };

    setAttributes([...updated, newAttr]);

    setNewAttrName("");
    setNewAttrType(COMMON_SQL_TYPES[0]);
    setNewIsPrimary(false);
    setNewIsIdentity(false);
  };

  /* ---------- REMOVER ATRIBUTOS ---------- */
  const removeAttribute = (id: string) => {
    setAttributes(prev => prev.filter(a => a.id !== id));
  };

  /* ---------- TOGGLE PK---------- */
  const togglePrimary = (id: string) => {
    setAttributes(prev => prev.map(a => a.id === id ? { ...a, isPrimary: !a.isPrimary } : a));
  };

  /* ---------- TOGGLE IDENTITY ---------- */
  const toggleIdentity = (id: string) => {
    setAttributes(prev => {
      const target = prev.find(a => a.id === id);
      if (!target) return prev;
      const willBe = !target.isIdentity;
      if (willBe) {
        return prev.map(a => (a.id === id ? { ...a, isIdentity: true } : { ...a, isIdentity: false }));
      } else {
        return prev.map(a => (a.id === id ? { ...a, isIdentity: false } : a));
      }
    });
  };

  /* ---------- BTN GENERAR ARCHIVOS ---------- */
  const handleGenerate = async () => {
    const tbl = tableName.trim();
    if (!tbl) {
      toast.warn("Ingresa el nombre de la tabla");
      return;
    }
    if (attributes.length === 0) {
      toast.warn("Agrega al menos un atributo");
      return;
    }

    // SÓLO UN IDENTITY
    const identityCount = attributes.filter(a => a.isIdentity).length;
    if (identityCount > 1) {
      toast.error("Sólo puede haber una columna marcada como Identity. Desmarca las demás.");
      return;
    }

    // ATRIBUTOS DUPLICADOS
    const names = attributes.map(a => a.name.toLowerCase());
    const dup = names.some((v, i) => names.indexOf(v) !== i);
    if (dup) {
      toast.error("Hay atributos con nombres duplicados. Revísalos.");
      return;
    }

    // AL MENOS UNA PK
    const hasPK = attributes.some(a => a.isPrimary);
    if (!hasPK) {
      toast.error("Marque al menos una columna como PK.");
      return;
    }

    const payload: GeneratorData = { tableName: sanitizeColumnName(tbl), attributes, category };

    try {
      const files = await generateFiles(payload);
      setGenerated(files);
      const map: Record<string, boolean> = {};
      files.forEach((f: { filename: string | number; }) => (map[f.filename] = false));
      setExpandedMap(map);
      toast.success("Archivos generados correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error generando archivos");
    }
  };

  /* ---------- TOGGLE PARA EXPANDIR ARCHIVOS GENERADOS ---------- */
  const toggleExpanded = (filename: string) => {
    setExpandedMap(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  /* ---------- COPIAR AL PORTAPAPELES ---------- */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Código copiado al portapapeles");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  /* ---------- DESCARGAR ARCHIVO  ---------- */
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return {
    // states
    tableName,
    setTableName,
    attributes,
    newAttrName,
    setNewAttrName,
    newAttrType,
    setNewAttrType,
    newIsPrimary,
    setNewIsPrimary,
    newIsIdentity,
    setNewIsIdentity,
    generated,
    category,
    setCategory,
    expandedMap,

    COMMON_SQL_TYPES,
    CATEGORIES,

    addAttribute,
    removeAttribute,
    togglePrimary,
    toggleIdentity,
    handleGenerate,
    toggleExpanded,
    copyToClipboard,
    downloadFile
  } as const;
}
