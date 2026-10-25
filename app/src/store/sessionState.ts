import {create} from 'zustand';
import { addCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnect } from '../services/session/model';
import type { PublicWorkspaceDefinition } from '../services/session/types';


interface SessionState {
    publicSession: PublicWorkspaceDefinition;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    loginOrganization: (orgKey: string) => void;
    initializeSession: () => void;
    disconnect: () => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { version: 1, activeOrgKey: null, connections: [] },
        createSession: () => {
            createSession().then((s) => {
                s.connections.forEach((conn) => {
                    if (conn.status === 'CONNECTED') {
                        addCommand({command: `close_${conn.orgKey.replace(':', '_')}`,  description: `close ${conn.alias}:${conn.organizationId}`, context: CONTEXT_LEVEL.INIT,  action: () => { get().disconnect();}});
                    } else {
                        addCommand({command: `login_${conn.orgKey.replace(':', '_')}`,  description: `login ${conn.alias}:${conn.organizationId}`, context: CONTEXT_LEVEL.INIT,  action: () => { get().loginOrganization(conn.orgKey);}});
                    }
                });
                set({publicSession: s});
            });
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
        disconnect: () => {
            disconnect();
        },
        initializeSession: () => {
            addCommand({...SESSION_CMD.PROD, action: () => { get().loginSFDC();}});
            addCommand({...SESSION_CMD.SANDBOX, action: () => { get().loginSandBox();}});
        }
    }   
});


export default sessionState;


