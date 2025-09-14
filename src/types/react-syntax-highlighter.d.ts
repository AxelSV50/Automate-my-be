// src/types/react-syntax-highlighter.d.ts
declare module "react-syntax-highlighter" {
  // Exporta el componente por defecto y el named export Prism
  const defaultExport: any;
  export default defaultExport;
  export const Prism: any;
  export const Light: any;
  export const PrismLight: any;
  // Por si usas otros exports
  export const SyntaxHighlighter: any;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const atomDark: any;
  export const okaidia: any;
  export const coy: any;
  export const prism: any;
  const _default: any;
  export default _default;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism/index.js" {
  export * from "react-syntax-highlighter/dist/esm/styles/prism";
}

declare module "react-syntax-highlighter/dist/cjs/index.js" {
  const content: any;
  export = content;
}
