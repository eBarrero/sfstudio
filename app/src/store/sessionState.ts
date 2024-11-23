import {create} from 'zustand';
import { addCommand, SESSION_CMD, CONTEXT_LEVEL } from '../core/commandManager';
import { createSession, loginSFDC, loginSandBox, loginOrganization, disconnect } from '../services/session/model';


interface SessionState {
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    loginOrganization: (orgName: string) => void;
    initializeSession: () => void;
    disconnect: (orgName: string) => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { currentConnection: 0, connections: [] },
        createSession: () => {
            createSession().then((s) => {
                s.connections.forEach(conn => {
                    if (conn.isConnected) {
                        addCommand({menuItem:'Login', menuOption:`${conn.name}`,command: `login_${conn.name}`,                      description: `${conn.name}`, context: CONTEXT_LEVEL.INIT,
                            action: () => { get().disconnect(conn.name);}});
                    } else {
                        addCommand({menuItem:'Login', menuOption:`${conn.name}`,command: `login_${conn.name}`,                      description: `${conn.name}`, context: CONTEXT_LEVEL.INIT,
                            action: () => { get().loginOrganization(conn.name);}});
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
        loginOrganization: (orgName: string) => {
            loginOrganization(orgName);
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


