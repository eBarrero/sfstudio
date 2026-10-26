import {create} from 'zustand';
import { addCommand, deleteCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnectOrg, closeWorkspace, selectOrganization } from '../services/session/model';
import type { PublicWorkspaceDefinition } from '../services/session/types';
import { ApiError } from '../services/http/apiClient';


interface SessionState {
    publicSession: PublicWorkspaceDefinition;
    lastError: string | null;
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
                            context,
                            action: () => { void get().selectOrganization(conn.orgKey); },
                        });
                        addCommand({
                            command: `Disconnect_org_${key}`,
                            description: `Desconectar ${conn.alias}`,
                            context,
                            action: () => { void get().disconnectOrg(conn.orgKey); },
                        });
                    } else {
                        addCommand({
                            command: `Reconnect_org_${key}`,
                            description: `Reautenticar ${conn.alias}`,
                            context,
                            action: () => { get().loginOrganization(conn.orgKey); },
                        });
                    }
                }
            });
            if (workspace.connections.length > 0) {
                for (const context of contexts) {
                    addCommand({
                        command: 'Close_workspace',
                        description: 'Cerrar el workspace',
                        context,
                        action: () => { void get().closeWorkspace(); },
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
            }
        },
        disconnectOrg: async (orgKey: string) => {
            try {
                get().setWorkspace(await disconnectOrg(orgKey));
            } catch {
                set({ lastError: 'No se pudo desconectar la organización.' });
            }
        },
        closeWorkspace: async () => {
            try {
                await closeWorkspace();
                get().setWorkspace({ version: 1, connections: [], activeOrgKey: null });
            } catch {
                set({ lastError: 'No se pudo cerrar el workspace.' });
            }
        },
        initializeSession: () => {
            for (const context of Object.values(CONTEXT_LEVEL)) {
                addCommand({...SESSION_CMD.PROD, context, action: () => { get().loginSFDC();}});
                addCommand({...SESSION_CMD.SANDBOX, context, action: () => { get().loginSandBox();}});
            }
        }
    }   
});


export default sessionState;


