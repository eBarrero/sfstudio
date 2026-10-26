import {create} from 'zustand';
import { addCommand, deleteCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnectOrg, closeWorkspace, selectOrganization } from '../services/session/model';
import type { PublicWorkspaceDefinition } from '../services/session/types';
import { ApiError } from '../services/http/apiClient';
import { createWorkspaceActionDispatcher, type WorkspaceAction, type ActionResult } from '../core/workspaceActions';
import dataState from './dataState';


interface SessionState {
    publicSession: PublicWorkspaceDefinition;
    lastError: string | null;
    lastActionFeedback: string | null;
    setWorkspace: (workspace: PublicWorkspaceDefinition) => void;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    loginOrganization: (orgKey: string) => void;
    initializeSession: () => void;
    disconnectOrg: (orgKey: string) => Promise<void>;
    closeWorkspace: () => Promise<void>;
    selectOrganization: (orgKey: string) => Promise<void>;
    expireWorkspace: () => void;
}

export const ORG_USE_ACTION_ID = 'org.use';

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { version: 1, activeOrgKey: null, connections: [] },
        lastError: null,
        lastActionFeedback: null,
        setWorkspace: (workspace) => {
            deleteCommand('Disconnect_org_');
            deleteCommand('Reconnect_org_');
            deleteCommand('Select_org_');
            deleteCommand('Close_workspace');
            const contexts = Object.values(CONTEXT_LEVEL);
            workspace.connections.forEach(conn => {
                const key = conn.orgKey.replace(':', '_');
                for (const context of contexts) {
                    if (conn.status === 'CONNECTED') {
                        addCommand({
                            command: `Select_org_${key}`,
                            description: `Usar ${conn.alias} (${conn.organizationId})`,
                            actionId: ORG_USE_ACTION_ID,
                            menuItem: 'Org', menuCaption: `Usar ${conn.alias} (${conn.organizationId})`,
                            context,
                            action: () => { void dispatchWorkspaceAction({ id: 'org.use', orgKey: conn.orgKey }, context); },
                        });
                        addCommand({
                            command: `Disconnect_org_${key}`,
                            description: `Desconectar ${conn.alias}`,
                            actionId: 'org.close',
                            menuItem: 'Org', menuCaption: `Desconectar ${conn.alias} (${conn.organizationId})`,
                            context,
                            action: () => { void dispatchWorkspaceAction({ id: 'org.close', orgKey: conn.orgKey }, context); },
                        });
                    } else if (conn.status === 'REAUTH_REQUIRED' || conn.status === 'ERROR') {
                        addCommand({
                            command: `Reconnect_org_${key}`,
                            description: `Reautenticar ${conn.alias}`,
                            actionId: 'org.reconnect',
                            menuItem: 'Org', menuCaption: `Reautenticar ${conn.alias} (${conn.organizationId})`,
                            context,
                            action: () => { void dispatchWorkspaceAction({ id: 'org.reconnect', orgKey: conn.orgKey }, context); },
                        });
                    }
                }
            });
            if (workspace.connections.length > 0) {
                for (const context of contexts) {
                    addCommand({
                        command: 'Close_workspace',
                        description: 'Cerrar el workspace',
                        actionId: 'workspace.close',
                        menuItem: 'Workspace', menuCaption: 'Cerrar workspace',
                        context,
                        action: () => { void dispatchWorkspaceAction({ id: 'workspace.close' }, context); },
                    });
                }
            }
            set({ publicSession: workspace, lastError: null });
        },
        createSession: () => {
            createSession().then((s) => {
                get().setWorkspace(s);
            }).catch((error: unknown) => {
                if (error instanceof ApiError && error.code === 'SESSION_INVALID') {
                    get().expireWorkspace();
                } else set({ lastError: 'No se pudo cargar el workspace.' });
            });
        },
        expireWorkspace: () => {
            get().setWorkspace({ version: 1, activeOrgKey: null, connections: [] });
            set({ lastError: 'La sesión caducó. Conecta de nuevo la organización.' });
        },
        loginSFDC: () => {
            loginSFDC();
        },
        loginSandBox: () => {
            loginSandBox();
        },
        loginOrganization: (orgKey: string) => {
            loginOrganization(orgKey);
        },
        selectOrganization: async (orgKey: string) => {
            try {
                get().setWorkspace(await selectOrganization(orgKey));
            } catch (error) {
                const message = error instanceof ApiError && error.code === 'REAUTH_REQUIRED'
                    ? 'Reautentica la organización antes de usarla.'
                    : 'No se pudo seleccionar la organización.';
                set({ lastError: message });
                throw error;
            }
        },
        disconnectOrg: async (orgKey: string) => {
            try {
                get().setWorkspace(await disconnectOrg(orgKey));
            } catch (error) {
                set({ lastError: 'No se pudo desconectar la organización.' });
                throw error;
            }
        },
        closeWorkspace: async () => {
            try {
                await closeWorkspace();
                get().setWorkspace({ version: 1, connections: [], activeOrgKey: null });
            } catch (error) {
                set({ lastError: 'No se pudo cerrar el workspace.' });
                throw error;
            }
        },
        initializeSession: () => {
            for (const context of Object.values(CONTEXT_LEVEL)) {
                addCommand({...SESSION_CMD.PROD, context, actionId: 'org.connect',
                    action: () => { void dispatchWorkspaceAction({ id: 'org.connect', environment: 'PRODUCTION' }, context); }});
                addCommand({...SESSION_CMD.SANDBOX, context, actionId: 'org.connect',
                    action: () => { void dispatchWorkspaceAction({ id: 'org.connect', environment: 'SANDBOX' }, context); }});
            }
        }
    }   
});


export default sessionState;

const workspaceDispatcher = createWorkspaceActionDispatcher({
    getWorkspace: () => sessionState.getState().publicSession,
    selectOrganization: orgKey => sessionState.getState().selectOrganization(orgKey),
    disconnectOrg: orgKey => sessionState.getState().disconnectOrg(orgKey),
    reconnectOrg: orgKey => sessionState.getState().loginOrganization(orgKey),
    connectOrg: environment => environment === 'PRODUCTION'
        ? sessionState.getState().loginSFDC() : sessionState.getState().loginSandBox(),
    closeWorkspace: () => sessionState.getState().closeWorkspace(),
    refreshMetadata: orgKey => dataState.getState().refreshMetadata(orgKey),
});

export async function dispatchWorkspaceAction(action: WorkspaceAction, context: CONTEXT_LEVEL): Promise<ActionResult> {
    const result = await workspaceDispatcher(action, context);
    sessionState.setState({
        lastActionFeedback: result.message,
        lastError: result.ok ? null : result.message,
    });
    return result;
}


