import { get } from './api.js';

interface Project {
  id: number;
  name: string;
}

export async function resolveProjectId(wsId: number, projectInput: string): Promise<number> {
  if (/^\d+$/.test(projectInput)) {
    return Number(projectInput);
  }

  const projects = await get<Project[]>(`/workspaces/${wsId}/projects`);
  const matches = projects.filter((p) => p.name.toLowerCase() === projectInput.toLowerCase());

  if (matches.length === 0) {
    throw new Error(`Project "${projectInput}" not found.`);
  }
  if (matches.length > 1) {
    const list = matches.map((p) => `  ${p.id}  ${p.name}`).join('\n');
    throw new Error(`Multiple projects match "${projectInput}". Use the numeric project ID:\n${list}`);
  }

  return matches[0].id;
}
