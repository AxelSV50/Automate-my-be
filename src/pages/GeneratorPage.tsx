import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  List,
  Row,
  Select,
  Space,
  Typography,
  Checkbox,
  Tooltip
} from "antd";
import { DeleteOutlined, PlusOutlined, DownloadOutlined, CopyOutlined } from "@ant-design/icons";
import type { Attribute, GeneratorData } from "../types/dtos";
import { generateFiles } from "../services/templateService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const { Title, Text } = Typography;
const { Option } = Select;

const COMMON_SQL_TYPES = [
  "int", "bigint", "smallint", "decimal", "numeric", "float",
  "varchar", "nvarchar", "text", "datetime", "date", "bit"
];
const CATEGORIES = [
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

type GeneratedUnit = { filename: string; content: string; title?: string; description?: string };

export default function GeneratorPage() {
  const [tableName, setTableName] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<string>(COMMON_SQL_TYPES[0]);
  const [newIsPrimary, setNewIsPrimary] = useState<boolean>(false);
  const [newIsIdentity, setNewIsIdentity] = useState<boolean>(false);
  const [generated, setGenerated] = useState<GeneratedUnit[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0] ?? "Catalogo");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  /* ---------- Add attribute with validations ---------- */
  const addAttribute = () => {
    const raw = newAttrName.trim();
    if (!raw) {
      toast.warn("El nombre del atributo no puede estar vacío");
      return;
    }

    const sanitized = sanitizeColumnName(raw);
    // duplicate check (case-insensitive)
    const exists = attributes.some(a => a.name.toLowerCase() === sanitized.toLowerCase());
    if (exists) {
      toast.error(`Ya existe un atributo con nombre "${sanitized}"`);
      return;
    }

    // If adding an identity, ensure only one: prepare the updated array
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

  /* ---------- Remove attribute ---------- */
  const removeAttribute = (id: string) => {
    setAttributes(prev => prev.filter(a => a.id !== id));
  };

  /* ---------- Toggle primary key ---------- */
  const togglePrimary = (id: string) => {
    setAttributes(prev => prev.map(a => a.id === id ? { ...a, isPrimary: !a.isPrimary } : a));
  };

  /* ---------- Toggle identity (ensuring only one is active) ---------- */
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

  /* ---------- Generate files ---------- */
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

    // Validate identity uniqueness
    const identityCount = attributes.filter(a => a.isIdentity).length;
    if (identityCount > 1) {
      toast.error("Sólo puede haber una columna marcada como Identity. Desmarca las demás.");
      return;
    }

    // Validate duplicates
    const names = attributes.map(a => a.name.toLowerCase());
    const dup = names.some((v, i) => names.indexOf(v) !== i);
    if (dup) {
      toast.error("Hay atributos con nombres duplicados. Revísalos.");
      return;
    }

    // Warn if no PK
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
      files.forEach(f => (map[f.filename] = false));
      setExpandedMap(map);
      toast.success("Archivos generados correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error generando archivos");
    }
  };

  /* ---------- Toggle expanded for a generated unit ---------- */
  const toggleExpanded = (filename: string) => {
    setExpandedMap(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  /* ---------- Copy to clipboard ---------- */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Código copiado al portapapeles");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  /* ---------- Download helper  ---------- */
  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
      <Title level={2} style={{ color: "#fff", paddingLeft: "15px", fontFamily: "monospace" }}>
        Generador de Negocio LDCREDIT
      </Title>

      <Row gutter={24}>
        {/* LEFT: Form */}
        <Col xs={24} md={12}>
          <Card title="Definir tabla" bordered={false} style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Input
                placeholder="Nombre de la tabla"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
              <Space style={{ marginTop: 8 }}>
                <Text strong style={{ color: "#fff" }}>Categoría: </Text>
                <Select
                  value={category}
                  onChange={(val) => setCategory(val)}
                  style={{ width: 260, marginLeft: 12 }}
                  dropdownMatchSelectWidth={false}
                >
                  {CATEGORIES.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Space>

              <div>
                <Text strong style={{ color: "#fff" }}>Agregar atributo</Text>
                <Space style={{ width: "100%", marginTop: 8 }} wrap>
                  <Input
                    placeholder="Nombre atributo"
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    style={{ width: 180 }}
                  />
                  <Select
                    value={newAttrType}
                    onChange={(val) => setNewAttrType(val)}
                    style={{ width: 160 }}
                  >
                    {COMMON_SQL_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                  </Select>

                  <Tooltip title="Primary Key">
                    <Checkbox checked={newIsPrimary} onChange={e => setNewIsPrimary(e.target.checked)}>
                      PK
                    </Checkbox>
                  </Tooltip>

                  <Tooltip title="Identity / Autoincrement (solo 1)">
                    <Checkbox
                      checked={newIsIdentity}
                      onChange={(e) => setNewIsIdentity(e.target.checked)}
                    >
                      Identity
                    </Checkbox>
                  </Tooltip>

                  <Button type="primary" icon={<PlusOutlined />} onClick={addAttribute} style={{ alignSelf: "center" }}>
                    Agregar
                  </Button>
                </Space>
              </div>

              {/* Attributes list (no column edit) */}
              <List
                bordered
                dataSource={attributes}
                locale={{ emptyText: <Text type="secondary">No hay atributos aún.</Text> }}
                renderItem={attr => (
                  <List.Item
                    actions={[
                      <Checkbox
                        checked={!!attr.isPrimary}
                        onChange={() => togglePrimary(attr.id)}
                        key="pk"
                        title="Marcar como PK"
                      >
                        PK
                      </Checkbox>,
                      <Checkbox
                        checked={!!attr.isIdentity}
                        onChange={() => toggleIdentity(attr.id)}
                        key="id"
                        title="Identity"
                      >
                        ID
                      </Checkbox>,
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => removeAttribute(attr.id)}
                        key="del"
                      />
                    ]}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                        <div>
                          <Text style={{ color: "#fff", marginRight: 8 }}>{attr.name}</Text>
                          <Text code>{attr.type}</Text>
                        </div>

                        {/* removed editable "Col:" input per request */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {attr.isPrimary && <Text type="success">PK</Text>}
                          {attr.isIdentity && <Text type="warning">Identity</Text>}
                        </div>
                      </Space>
                    </Space>
                  </List.Item>
                )}
                style={{ maxHeight: 300, overflowY: "auto" }}
              />

              <Button type="primary" onClick={handleGenerate} style={{ marginTop: 8 }}>
                Generar archivos
              </Button>
            </Space>
          </Card>
        </Col>

        {/* RIGHT: Generated files */}
        <Col xs={24} md={12}>
          <Card title="Archivos generados" bordered={false} style={{ minHeight: 400, borderRadius: 8 }}>
            {generated.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 50 }}>
                <img src="/folder-open-icon.png" alt="placeholder" style={{ maxWidth: "10%" }} />
                <Text type="secondary" style={{ display: "block", marginTop: 12 }}>Sin archivos por ahora</Text>
              </div>
            ) : (
              <List
                dataSource={generated}
                renderItem={f => {
                  const ext = f.filename.split('.').pop();
                  const isTxt = ext === "txt";
                  const isExpanded = !!expandedMap[f.filename];

                  return (
                    <List.Item
                    
                       actions={[
                          <Text
                            key="toggle"
                            type="secondary"
                            style={{ cursor: "pointer", alignSelf: "center", marginRight: 0, marginLeft:0 }}
                            onClick={() => toggleExpanded(f.filename)}
                          >
                            {isExpanded ? "Ocultar" : "Mostrar"}
                          </Text>,
                          <Button
                            key="download"
                            type="primary" // filled background as requested
                            icon={<DownloadOutlined />}
                            onClick={() => downloadFile(f.filename, f.content)}
                          >
                            Descargar
                          </Button>
                        ]}
                      key={f.filename}
                    >
                      <List.Item.Meta
                        title={
                          <div
                            onClick={() => toggleExpanded(f.filename)}
                            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                          >
                            {isTxt ? (
                              <img src="/txt-file-icon.png" style={{ maxHeight: 24 }} />
                            ) : (
                              <img src="/vb-file-format-symbol.png" style={{ maxHeight: 24 }} />
                            )}
                            <Text style={{ color: "#fff" }}>{f.filename}</Text>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 15 }}>
                            {isExpanded && (
                              <>
                                {f.description && (
                                  <p style={{ color: "#a8a8a8ff", marginBottom: 12 }}>
                                    {f.description}
                                  </p>
                                )}

                                <SyntaxHighlighter language="vbnet" style={atomDark} customStyle={{
                                  borderRadius: 8,
                                  padding: 12,
                                  maxHeight: 260,
                                  overflow: "auto",
                                  background: "#1e1e1e"
                                }}>
                                  {f.content}
                                </SyntaxHighlighter>

                                <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, marginBottom: 8 }}>
                                  <Button type="dashed" icon={<CopyOutlined />} onClick={() => copyToClipboard(f.content)}>
                                    Copiar
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
