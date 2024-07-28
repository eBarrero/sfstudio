import {create} from 'zustand';
import { createSession, loginSFDC } from '../services/session/model';


  



interface SessionState {
    publicSession: PublicSesionDefinition;
    createSession: () => void;
    loginSFDC: () => void;
}

const useSessionState = create<SessionState>((set, get) => {
    return  {
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


export default useSessionState;