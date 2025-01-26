

export interface PublicConnectionDefinition  {
    alias: string;
    dbName: string;
    tech: string;
    isConnected: boolean;
    isOnError: boolean;
    isClose: boolean;
}

export interface PublicSesionDefinition  {
    connections: PublicConnectionDefinition[];
    currentConnection: number | null;
    sessionId: number;
}



export class SessionDTO { 
    constructor (private publicSessionDefinition: PublicSesionDefinition ) {
    }

    public serialize(): string {
        return Buffer.from(JSON.stringify(this.publicSessionDefinition)).toString('base64');
    }
} 
