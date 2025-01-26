
import { SessionError } from './../exceptions/sessionError';
import { configuredConnections } from '../entities/configuredConnections';
import { SessionDTO, PublicSesionDefinition } from '../dtos/sessionDTO';
import { UserDTO } from '../../application/dtos/userDTO';

// inteeface to connection are opens
interface OpenedConnections {
    isOpen: boolean;
    isOnError: boolean;
    isClose: boolean;
}

export class UserEntity { 
    private sessionId: number = 0;
    private userId: string = ''; // db id of the user
    private configuredConnections: configuredConnections[] = [];
    private openConnections: Map<string,OpenedConnections> = new Map<string,OpenedConnections>(); 
    private isPendingToUpdate: boolean = false;
    // indicates the indesx the last bd connected
    private currentConnection: number = -1;

    constructor(sessionId: number | null) {
        if (!sessionId) {
            this.sessionId = this.sessionId = Math.floor(Math.random() * 1000000);
        } else {
            this.sessionId = sessionId;
        }
    }    

    public getSessionId(): number {
        if (this.sessionId === 0) {
            throw new SessionError(`Token not value`);
        }
        return this.sessionId;
    }

    public setPendingToUpdate(pending: boolean) {
        this.isPendingToUpdate = pending;
    }
    public getPendingToUpdate(): boolean {
        return this.isPendingToUpdate;
    }

    public setcurrentConnection(dbName: string): number {
        console.log('setcurrentConnection:['+ dbName + ']');
        this.currentConnection =  this.configuredConnections.findIndex(connection => connection.getDbName() === dbName);
        return this.currentConnection;
    }

    public getCurrentConnection(): number | null {
        return (this.currentConnection===-1) ? null : this.currentConnection;
    }

    public checkConnectionExists(dbName: string): boolean {
        console.log('checkConnectionExists:['+ dbName + ']');
        return this.configuredConnections.some(connection => connection.getDbName() === dbName);
    }

    public setConnectionAsOpen(dbName: string) {
        this.openConnections.set(dbName, { isOpen: true, isOnError: false, isClose: false });
    }





    public getConnectionByName(dbName:string) : configuredConnections {
        console.log('getConnection:['+ dbName + ']');
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
        console.log('getConnection:['+ connectionId + ']');
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
            sessionId: this.sessionId,
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
        console.log(result);
        return new SessionDTO(result);
    }












}

    







