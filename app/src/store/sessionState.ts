import {create} from 'zustand';
import { addCommand, deleteCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnectOrg, closeWorkspace } from '../services/session/model';
import type { PublicWorkspaceDefinition } from '../services/session/types';


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
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { version: 1, activeOrgKey: null, connections: [] },
        lastError: null,
        setWorkspace: (workspace) => {
            deleteCommand('Disconnect_org_');
            deleteCommand('Reconnect_org_');
            deleteCommand('Close_workspace');
            const contexts = Object.values(CONTEXT_LEVEL);
            workspace.connections.forEach(conn => {
                const key = conn.orgKey.replace(':', '_');
                for (const context of contexts) {
                    if (conn.status === 'CONNECTED') {
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
            }).catch(() => set({ lastError: 'No se pudo cargar el workspace.' }));
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
            addCommand({...SESSION_CMD.PROD, action: () => { get().loginSFDC();}});
            addCommand({...SESSION_CMD.SANDBOX, action: () => { get().loginSandBox();}});
        }
    }   
});


export default sessionState;


