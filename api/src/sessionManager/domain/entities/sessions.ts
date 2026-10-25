import { UserEntity } from "./UserEntity";
import { SessionError } from "./../exceptions/sessionError";
import { SessionId } from "./workspaceSession";


/**
 * @description Class to manage all sessions
 */
export class Sessions {
    private sessions: Map<SessionId, UserEntity> = new Map();

    constructor(private readonly onRemoved: (sessionId: SessionId) => void = () => {}) {}

    public lookUpUserOnCache(sessionId: SessionId): UserEntity | null {
        const user = this.sessions.get(sessionId);

        if (user?.isExpired()) {
            this.sessions.delete(sessionId);
            this.onRemoved(sessionId);
            return null;
        }

        return user ?? null;
    }

    public getUser(sessionId: SessionId): UserEntity {
        const session = this.lookUpUserOnCache(sessionId);
        if (session) {
            return session;
        }
        throw new SessionError("Session expired or invalid");
    }

    public addNewUser(): UserEntity {
        const newUser = new UserEntity(null);
        this.sessions.set(newUser.getSessionId(), newUser);
        return newUser;
    }

    public rebuildUser(sessionId: SessionId, expiresAt: Date): UserEntity {
        const newUser = new UserEntity(sessionId, expiresAt);

        if (newUser.isExpired()) {
            throw new SessionError("Session expired or invalid");
        }

        this.sessions.set(newUser.getSessionId(), newUser);
        return newUser;
    }

    public rotateUserSession(user: UserEntity) {
        const rotation = user.rotateSession();
        this.sessions.delete(rotation.previousId);
        this.sessions.set(rotation.sessionId, user);
        return rotation;
    }

    public deleteSession(id: SessionId): void {
        this.sessions.delete(id);
        this.onRemoved(id);
    }

    public sweepExpired(): void {
        for (const id of this.sessions.keys()) this.lookUpUserOnCache(id);
    }
}
