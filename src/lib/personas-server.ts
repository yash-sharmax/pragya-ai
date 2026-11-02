import fs from "fs";
import path from "path";
import { PersonaId, PERSONAS } from "./personas";

// Cache loaded prompts in memory
const promptCache: Partial<Record<PersonaId, string>> = {};

export function getPersonaPrompt(id: PersonaId): string {
  if (promptCache[id]) {
    return promptCache[id]!;
  }

  const persona = PERSONAS[id];
  if (!persona) {
    throw new Error(`Unknown persona id: ${id}`);
  }

  const projectRoot = process.cwd();
  const filePath = path.join(projectRoot, persona.promptFilename);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      promptCache[id] = content;
      return content;
    }
  } catch (err) {
    console.error(`Error loading prompt file for ${id}:`, err);
  }

  return `You are ${persona.name}, specialized in ${persona.domain}.`;
}
