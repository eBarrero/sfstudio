import { request, URL_PATH, deleteOrg, deleteWorkspace } from './controller';
import type { PublicWorkspaceDefinition } from './types';




  export async function createSession(): Promise<PublicWorkspaceDefinition>  {
    const response = await request('v1/workspace');
    if (response === '#Error') return { version: 1, connections: [], activeOrgKey: null };
    return response as PublicWorkspaceDefinition;
  }

  export function loginSFDC(): void {
    window.location.href=`${URL_PATH}auth/SF_Prod`;
  }

  export function loginSandBox(): void {
    window.location.href=`${URL_PATH}auth/SF_Test`;
  }

  export function loginOrganization(orgKey: string): void {
    window.location.href=`${URL_PATH}v1/connections/${encodeURIComponent(orgKey)}/authorize`;
  }

  export async function disconnectOrg(orgKey: string): Promise<PublicWorkspaceDefinition> {
    return deleteOrg(orgKey);
  }

  export async function closeWorkspace(): Promise<void> {
    await deleteWorkspace();
  }


