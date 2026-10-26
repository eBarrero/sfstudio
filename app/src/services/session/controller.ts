
import type { PublicWorkspaceDefinition } from './types';
export const URL_PATH = '/api/';

export async function request(uri: string): Promise<PublicWorkspaceDefinition | '#Error'> {
    const URL = `${URL_PATH}${uri}`;
    const res = await fetch(URL);
    if (!res.ok) {
      return '#Error';
    } 
    return await res.json() as PublicWorkspaceDefinition;
}

export async function deleteOrg(orgKey: string): Promise<PublicWorkspaceDefinition> {
    const response = await fetch(`${URL_PATH}v1/workspace/orgs/${encodeURIComponent(orgKey)}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('No se pudo desconectar la organización.');
    return await response.json() as PublicWorkspaceDefinition;
}

export async function deleteWorkspace(): Promise<void> {
    const response = await fetch(`${URL_PATH}v1/workspace`, { method: 'DELETE' });
    if (!response.ok) throw new Error('No se pudo cerrar el workspace.');
}




