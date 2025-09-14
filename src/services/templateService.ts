import type { GeneratorData } from "../types/dtos";
import { generateManagerFile } from "./managerService";
import { generateEntityFile } from "./entityService";
import { generateControlBusinessFragment } from "./controlBusinessService";
import { generateInterfaceIWCFFragment } from "./interfaceIWCFService";
import { generateWcfImplementationFragment } from "./wcfImplementationService";

export type GeneratedUnit = {
  filename: string;
  content: string;
  title?: string; 
  description?: string; 
};
export async function generateFiles(data: GeneratorData): Promise<Array<GeneratedUnit>> {
  const entityFile = generateEntityFile(data);
  const managerFile = generateManagerFile(data);
  const controlFrag = generateControlBusinessFragment(data);
  const interfaceFrag = generateInterfaceIWCFFragment(data);
  const wcfImplFrag = generateWcfImplementationFragment(data);

  return [entityFile, managerFile, controlFrag, interfaceFrag, wcfImplFrag];
}
