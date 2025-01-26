import {create} from 'zustand';
import { addCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnect } from '../services/session/model';


interface SessionState {
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    loginOrganization: (connectionId: number) => void;
    initializeSession: () => void;
    disconnect: (orgName: string) => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { currentConnection: 0, connections: [] },
        createSession: () => {
            createSession().then((s) => {
                s.connections.forEach((conn, index) => {
                    if (conn.isConnected) {
                        addCommand({command: `close_${conn.alias}`,  description: `close ${conn.alias}:${conn.dbName}`, context: CONTEXT_LEVEL.INIT,  action: () => { get().disconnect(conn.dbName);}});
                    } else {
                        addCommand({command: `login_${conn.alias}`,  description: `login ${conn.alias}:${conn.dbName}`, context: CONTEXT_LEVEL.INIT,  action: () => { get().loginOrganization(index);}});
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
        loginOrganization: (connectionId: number) => {
            loginOrganization(connectionId);
        },
        disconnect: (orgName: string) => {
            disconnect(orgName);
        },
        initializeSession: () => {
            addCommand({...SESSION_CMD.PROD, action: () => { get().loginSFDC();}});
            addCommand({...SESSION_CMD.SANDBOX, action: () => { get().loginSandBox();}});
        }
    }   
});


export default sessionState;


