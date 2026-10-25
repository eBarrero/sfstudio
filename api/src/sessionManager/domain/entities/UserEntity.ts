
import { SessionError } from './../exceptions/sessionError';
import { configuredConnections } from '../entities/configuredConnections';
import { SessionDTO, PublicSesionDefinition } from '../dtos/sessionDTO';
import { UserDTO } from '../../application/dtos/userDTO';
import { SessionId, WorkspaceSession } from './workspaceSession';

// inteeface to connection are opens
interface OpenedConnections {
    isOpen: boolean;
    isOnError: boolean;
    isClose: boolean;
}

export class UserEntity { 
    private readonly workspaceSession: WorkspaceSession;
    private configuredConnections: configuredConnections[] = [];
    private openConnections: Map<string,OpenedConnections> = new Map<string,OpenedConnections>(); 
    private isPendingToUpdate: boolean = false;
    // indicates the indesx the last bd connected
    private currentConnection: number = -1;

    constructor(sessionId: SessionId | null, expiresAt?: Date) {
        this.workspaceSession = new WorkspaceSession({
            id: sessionId ?? undefined,
            expiresAt,
        });
    }

    public getSessionId(): SessionId {
        return this.workspaceSession.getId();
    }

    public getExpiresAt(): Date {
        return this.workspaceSession.getExpiresAt();
    }

    public isExpired(): boolean {
        return this.workspaceSession.isExpired();
    }

    public rotateSession() {
        return this.workspaceSession.rotate();
    }

    public setPendingToUpdate(pending: boolean) {
        this.isPendingToUpdate = pending;
    }
    public getPendingToUpdate(): boolean {
        return this.isPendingToUpdate;
    }

    public setcurrentConnection(dbName: string): number {
        this.currentConnection =  this.configuredConnections.findIndex(connection => connection.getDbName() === dbName);
        return this.currentConnection;
    }

    public getCurrentConnection(): number | null {
        return (this.currentConnection===-1) ? null : this.currentConnection;
    }

    public checkConnectionExists(dbName: string): boolean {
        return this.configuredConnections.some(connection => connection.getDbName() === dbName);
    }

    public setConnectionAsOpen(dbName: string) {
        this.openConnections.set(dbName, { isOpen: true, isOnError: false, isClose: false });
    }





    public getConnectionByName(dbName:string) : configuredConnections {
        if (dbName === undefined) {
            return this.configuredConnections.at(-1)!;
        }

        const foundConnection = this.configuredConnections.find(connection => connection.getDbName() === dbName);
        if (!foundConnection) {
            throw new SessionError(`Connection with name "${dbName}" not found`);
        }
        return foundConnection;
    }

    public getConnection(connectionId: number) : configuredConnections {
        const connection = this.configuredConnections[connectionId];
        if (!connection) {
            throw new SessionError(`Connection with name "${connection}" not found`);
        }
        return connection;
    }


    public loadConnections(userDTO: UserDTO) {
        this.configuredConnections = [];
        this.configuredConnections = userDTO.getConnections().map((connection) => { return new configuredConnections(connection) });
        this.setPendingToUpdate(false);
    }


    public signOut() {
        //TODO: delete all connections and close the session
    }




    /**
     * Gets the session status as a base64 encoded string.
     * @returns The session status as a base64 encoded string.
     */
    public getSessionStatus(): SessionDTO {
        const result: PublicSesionDefinition = {
            connections: [],
            currentConnection: this.getCurrentConnection()
        };

        if (this.configuredConnections && this.configuredConnections.length !== 0) {
            this.configuredConnections.forEach((connection)=> {  
                let connectionStatus = { isOpen: false, isOnError: false, isClose: false };
                if (this.openConnections.has(connection.getDbName())) {
                    connectionStatus = this.openConnections.get(connection.getDbName())!;
                }
                result.connections.push( {alias: connection.getAlias() , dbName: connection.getDbName(),  tech: connection.getTech(), isConnected: connectionStatus.isOpen, isOnError: connectionStatus.isOnError, isClose: connectionStatus.isClose });
            });
        }
        return new SessionDTO(result);
    }












}

    







