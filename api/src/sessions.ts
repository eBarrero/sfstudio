import { Session } from "./session";
import { SessionError } from "./sessionError";


/**
 * @description Class to manage all sessions
 */
export class Sessions {
    private sessions: Map<number, Session> = new Map<number, Session>();

    public signIn(tokenId: number | null): string {
        const msg = tokenId ? "reuse Session: " : "New Session: ";
        const newSesion = new Session(tokenId);
        this.sessions.set(newSesion.id, newSesion);
        console.info(msg + newSesion.id); // Log out
        return newSesion.signInToken;
    }

    public async getSession(tokenId:number ): Promise<Session>  {
        if (this.sessions.has(tokenId)) {
            console.info("Session from cache: " + tokenId); 
            return this.sessions.get(tokenId)!;
        }
        const session = await Session.createSessionFromDB(tokenId);
        if (session) {
            console.info("Session from DB: " + tokenId);
            this.sessions.set(tokenId, session);
            return session;
        }
        throw new SessionError(`Session ${tokenId} not found`);
    }

    
    deleteConexion(id: number) {
        this.sessions.delete(id);
    }
} 


export const sessions = new Sessions();