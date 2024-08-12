import {create} from 'zustand';
import { createSession, loginSFDC } from '../services/session/model';


  



interface SessionState {
    sessionStatus: string;
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
}

const sessionState = create<SessionState>((set, get) => {
    return  {
        sessionStatus: 'INIT',
        publicSession: { currentConnection: 0, connections: [] },
        createSession: () => {
            createSession().then((s) => {
                set({publicSession: s});
            });
        },
        loginSFDC: () => {
            loginSFDC();
        }
    }   
    
});


export default sessionState;


