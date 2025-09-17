import type { GeneratorData } from "../types/dtos";
import { generateManagerFile } from "./Generators/managerService";
import { generateEntityFile } from "./Generators/entityService";
import { generateControlBusinessFragment } from "./Generators/controlBusinessService";
import { generateInterfaceIWCFFragment } from "./Generators/interfaceIWCFService";
import { generateWcfImplementationFragment } from "./Generators/wcfImplementationService";

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
