import { UserEntity } from "./UserEntity";
import { SessionError } from "./../exceptions/sessionError";


/**
 * @description Class to manage all sessions
 */
export class Sessions {
    private sessions: Map<number, UserEntity> = new Map<number, UserEntity>();

    public lookUpUserOnCache(sessionId: number): UserEntity | null {
        if (this.sessions.has(sessionId)) {
            console.info("Session from cache: " + sessionId); 
            return this.sessions.get(sessionId)!;
        }
        return null;
    }

    public getUser(sessionId:number ): UserEntity  {
        const session = this.lookUpUserOnCache(sessionId);
        if (session) {
            return session;
        }
        throw new SessionError(`Session ${sessionId} not found`);
    }

    public addNewUser(): UserEntity {
        const newUser = new UserEntity(null);
        this.sessions.set(newUser.getSessionId(), newUser);
        return newUser;
    }

    public rebuildUser(sessionId: number): UserEntity {
        const newUser = new UserEntity(sessionId);
        this.sessions.set(newUser.getSessionId(), newUser);
        return newUser;
    }


    
    deleteConexion(id: number) {
        this.sessions.delete(id);
    }
} 


export const sessions = new Sessions();