import {create} from 'zustand';
import { allCommandsList, CONTEXT_LEVEL } from '../constants/application';
import { createSession, loginSFDC, loginSandBox } from '../services/session/model';


interface SessionState {
    sessionStatus: string;
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
    loginSandBox: () => void;
    initializeSession: () => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        sessionStatus: CONTEXT_LEVEL.INIT,
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
            allCommandsList.set( '.prod',    { command: '.prod',    description: 'CMD.init.prod',    context:CONTEXT_LEVEL.INIT,  action: () => { get().loginSFDC();}});
            allCommandsList.set( '.sandbox', { command: '.sandbox', description: 'CMD.init.sandbox', context:CONTEXT_LEVEL.INIT,  action: () => { get().loginSandBox();}});
        }
    }   
});


export default sessionState;


