import { CONTEXT_LEVEL } from './commandManager';
import type { PublicWorkspaceDefinition } from '../services/session/types';

export type ActionId =
  | 'org.list'
  | 'org.use'
  | 'org.close'
  | 'org.reconnect'
  | 'org.connect'
  | 'metadata.refresh'
  | 'workspace.close';

export type WorkspaceAction =
  | { id: 'org.list' }
  | { id: 'org.use' | 'org.close' | 'org.reconnect'; orgKey: string }
  | { id: 'metadata.refresh'; orgKey: string }
  | { id: 'org.connect'; environment: 'PRODUCTION' | 'SANDBOX' }
  | { id: 'workspace.close' };

export type ActionResult =
  | { ok: true; id: ActionId; message: string; workspace: PublicWorkspaceDefinition }
  | { ok: false; id: ActionId; code: 'CONTEXT_NOT_ALLOWED' | 'ORG_NOT_FOUND' |
      'REAUTH_REQUIRED' | 'ACTION_FAILED'; message: string };

export interface WorkspaceActionPort {
  getWorkspace(): PublicWorkspaceDefinition;
  selectOrganization(orgKey: string): Promise<void>;
  disconnectOrg(orgKey: string): Promise<void>;
  reconnectOrg(orgKey: string): void;
  connectOrg(environment: 'PRODUCTION' | 'SANDBOX'): void;
  closeWorkspace(): Promise<void>;
  refreshMetadata(orgKey: string): Promise<void>;
}

export function createWorkspaceActionDispatcher(port: WorkspaceActionPort) {
  return async (action: WorkspaceAction, context: CONTEXT_LEVEL): Promise<ActionResult> => {
    if (!Object.values(CONTEXT_LEVEL).includes(context)) {
      return { ok: false, id: action.id, code: 'CONTEXT_NOT_ALLOWED',
        message: 'Esta acción no está disponible en el contexto actual.' };
    }
    const workspace = port.getWorkspace();
    if ('orgKey' in action) {
      const connection = workspace.connections.find(row => row.orgKey === action.orgKey);
      if (!connection) {
        return { ok: false, id: action.id, code: 'ORG_NOT_FOUND',
          message: 'La organización no pertenece al workspace.' };
      }
      if ((action.id === 'org.use' || action.id === 'metadata.refresh') &&
          connection.status !== 'CONNECTED') {
        return { ok: false, id: action.id, code: 'REAUTH_REQUIRED',
          message: 'Reautentica la organización antes de usarla.' };
      }
    }
    try {
      switch (action.id) {
        case 'org.list': break;
        case 'org.use': await port.selectOrganization(action.orgKey); break;
        case 'org.close': await port.disconnectOrg(action.orgKey); break;
        case 'org.reconnect': port.reconnectOrg(action.orgKey); break;
        case 'org.connect': port.connectOrg(action.environment); break;
        case 'metadata.refresh': await port.refreshMetadata(action.orgKey); break;
        case 'workspace.close': await port.closeWorkspace(); break;
      }
      const current = port.getWorkspace();
      const message = action.id === 'org.list'
        ? current.connections.map(row => `${row.alias} (${row.orgKey}): ${row.status}`).join('; ') || 'No hay organizaciones.'
        : `Acción ${action.id} ejecutada.`;
      return { ok: true, id: action.id, message, workspace: current };
    } catch {
      return { ok: false, id: action.id, code: 'ACTION_FAILED',
        message: 'No se pudo completar la acción.' };
    }
  };
}
