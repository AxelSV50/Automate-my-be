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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Ajusta la ruta del hook según dónde lo ubiques en tu repo
import { useGenerator } from "./hooks/UseGenerator";

const { Title, Text } = Typography;
const { Option } = Select;

export default function GeneratorPage() {

  const gen = useGenerator();

  return (
    <div style={{ padding: 24 }}>
      {/* CONTENEDOR DE NOTIFICACIONES */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />

      <Title level={2} style={{ color: "#fff", paddingLeft: "15px", fontFamily: "monospace" }}>
        GENERADOR DE NEGOCIO - LDCREDIT
        <Text style={{ color: "#8b8b8bff", fontFamily: "monospace", paddingLeft:"10px" }}>
              (v 0.0.3)
        </Text>
      </Title>

      <div style={{ paddingLeft: "17px" }}>
        <Text style={{ color: "#8b8b8bff", fontFamily: "monospace" }}>
          Crea un CRUD funcional en menos de 1s, siguiendo los estándares de LD. 
          <br/>Sólo descarga/copia cada snippet en la ubicación indicada al expandir los archivos generados.
        </Text>
      </div>
      <br/>

      <Row gutter={24}>
        {/* LEFT: FORMULARIO DE TABLA */}
        <Col xs={24} md={12}>
          <Card title="Parámetros iniciales" bordered={false} style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">

              <Text strong style={{ color: "#fff" }}>Nombre de la tabla</Text>
              <Input
                placeholder="Nombre tabla"
                value={gen.tableName}
                onChange={(e) => gen.setTableName(e.target.value)}
              />
              <Space style={{ marginTop: 8 }}>
                <Text strong style={{ color: "#fff" }}>Categoría: </Text>
                <Select
                  value={gen.category}
                  onChange={(val) => gen.setCategory(val)}
                  style={{ width: 260, marginLeft: 12 }}
                  dropdownMatchSelectWidth={false}
                >
                  {gen.CATEGORIES.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Space>

              <div>
                <Text strong style={{ color: "#fff" }}>Agregar atributo</Text>
                <Space style={{ width: "100%", marginTop: 8 }} wrap>
                  <Input
                    placeholder="Nombre atributo"
                    value={gen.newAttrName}
                    onChange={(e) => gen.setNewAttrName(e.target.value)}
                    style={{ width: 180 }}
                  />
                  <Select
                    value={gen.newAttrType}
                    onChange={(val) => gen.setNewAttrType(val)}
                    style={{ width: 160 }}
                  >
                    {gen.COMMON_SQL_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                  </Select>

                  <Tooltip title="Primary Key">
                    <Checkbox checked={gen.newIsPrimary} onChange={e => gen.setNewIsPrimary(e.target.checked)}>
                      PK
                    </Checkbox>
                  </Tooltip>

                  <Tooltip title="Autoincremental (sólo se permite 1)">
                    <Checkbox
                      checked={gen.newIsIdentity}
                      onChange={(e) => gen.setNewIsIdentity(e.target.checked)}
                    >
                      Identity
                    </Checkbox>
                  </Tooltip>

                  <Button type="primary" icon={<PlusOutlined />} onClick={gen.addAttribute} style={{ alignSelf: "center" }}>
                    Agregar
                  </Button>
                </Space>
              </div>

              <List
                bordered
                dataSource={gen.attributes}
                locale={{ emptyText: <Text type="secondary">No hay atributos aún.</Text> }}
                renderItem={attr => (
                  <List.Item
                    actions={[
                      <Checkbox
                        checked={!!attr.isPrimary}
                        onChange={() => gen.togglePrimary(attr.id)}
                        key="pk"
                        title="Marcar como PK"
                      >
                        PK
                      </Checkbox>,
                      <Checkbox
                        checked={!!attr.isIdentity}
                        onChange={() => gen.toggleIdentity(attr.id)}
                        key="id"
                        title="Identity"
                      >
                        ID
                      </Checkbox>,
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => gen.removeAttribute(attr.id)}
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

              <Button type="primary" onClick={gen.handleGenerate} style={{ marginTop: 8 }}>
                Generar archivos
              </Button>
            </Space>
          </Card>
        </Col>

        {/* RIGHT: ARCHIVOS GENERADOS*/}
        <Col xs={24} md={12}>
          <Card title="Archivos generados" bordered={false} style={{ minHeight: 435, borderRadius: 8 }}>

            {gen.generated.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 50 }}>
                <img src="/folder-open-icon.png" alt="placeholder" style={{ maxWidth: "10%" }} />
                <Text type="secondary" style={{ display: "block", marginTop: 12 }}>Sin archivos por ahora</Text>
              </div>
            ) : (
              <List
                dataSource={gen.generated}
                renderItem={f => {
                  const ext = f.filename.split('.').pop();
                  const isTxt = ext === "txt";
                  const isExpanded = !!gen.expandedMap[f.filename];

                  return (
                    <List.Item
                      actions={[
                        <Text
                          key="toggle"
                          type="secondary"
                          style={{ cursor: "pointer", alignSelf: "center", marginRight: 0, marginLeft:0 }}
                          onClick={() => gen.toggleExpanded(f.filename)}
                        >
                          {isExpanded ? "Ocultar" : "Mostrar"}
                        </Text>,
                        <Button
                          key="download"
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => gen.downloadFile(f.filename, f.content)}
                        >
                          Descargar
                        </Button>
                      ]}
                      key={f.filename}
                    >
                      <List.Item.Meta
                        title={
                          <div
                            onClick={() => gen.toggleExpanded(f.filename)}
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
                                  <Button type="dashed" icon={<CopyOutlined />} onClick={() => gen.copyToClipboard(f.content)}>
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
