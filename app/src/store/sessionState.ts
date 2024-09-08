import {create} from 'zustand';
import { addCommand,CONTEXT_LEVEL, SESSION_CMD } from '../constants/application';
import { createSession, loginSFDC, loginSandBox } from '../services/session/model';


interface SessionState {
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    initializeSession: () => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        publicSession: { currentConnection: 0, connections: [] },
        createSession: () => {
            createSession().then((s) => {
                set({publicSession: s});
            });
        },
        loginSFDC: () => {
            console.log('loginSFDC');
            loginSFDC();
        },
        loginSandBox: () => {
            loginSandBox();
        },
        initializeSession: () => {
            addCommand({...SESSION_CMD.PROD, action: () => { get().loginSFDC();}});
            addCommand({...SESSION_CMD.SANDBOX, action: () => { get().loginSandBox();}});
        }
    }   
});


export default sessionState;


