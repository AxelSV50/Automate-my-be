import React from "react";
import ReactDOM from "react-dom/client";
import GeneratorPage from "./pages/GeneratorPage";
import { ConfigProvider, theme } from "antd";
import { Analytics } from "@vercel/analytics/react"; 
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <Analytics/>
      <GeneratorPage />
    </ConfigProvider>
  </React.StrictMode>
);
