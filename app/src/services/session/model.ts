import { getWorkspace, deleteOrg, deleteWorkspace } from './controller';
import { apiClient } from '../http/apiClient';
import type { PublicWorkspaceDefinition } from './types';




  export async function createSession(): Promise<PublicWorkspaceDefinition>  {
    return getWorkspace();
  }

  export function loginSFDC(): void {
    window.location.href = apiClient.url('auth/SF_Prod', true);
  }

  export function loginSandBox(): void {
    window.location.href = apiClient.url('auth/SF_Test', true);
  }

  export function loginOrganization(orgKey: string): void {
    window.location.href = apiClient.url(`connections/${encodeURIComponent(orgKey)}/authorize`);
  }

  export async function disconnectOrg(orgKey: string): Promise<PublicWorkspaceDefinition> {
    return deleteOrg(orgKey);
  }

  export async function closeWorkspace(): Promise<void> {
    await deleteWorkspace();
  }


