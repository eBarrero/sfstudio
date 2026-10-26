
import { apiClient } from '../http/apiClient';
import type { PublicWorkspaceDefinition } from './types';

export const getWorkspace = () => apiClient.request<PublicWorkspaceDefinition>('workspace');

export const deleteOrg = (orgKey: string) =>
  apiClient.request<PublicWorkspaceDefinition>(`workspace/orgs/${encodeURIComponent(orgKey)}`, { method: 'DELETE' });

export const deleteWorkspace = () =>
  apiClient.request<void>('workspace', { method: 'DELETE' });




