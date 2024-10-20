import { AccessToken, AuthorizationCode, ModuleOptions } from "simple-oauth2";
import jsforce, { ListMetadataQuery, IdentityInfo  } from "jsforce";

interface MetadataField {
    fullName: string,
    description: string
}

interface MetadataInfo extends jsforce.MetadataInfo {
    fields: MetadataField[];
}
    

export class SessionError extends Error {
    errorNumber: number = 500;
    constructor(message: string) {
        super(message);
        this.name = "SessionError";
        if (message.includes("Session expired or invalid")) this.errorNumber = 401;
        console.error(`[${this.name}]: [${this.message}]`);
    }
    getErrorNumber(): number {  return this.errorNumber; }  
}

type ConnectionDefinition = {
    alias: string;
    name: string;
    sandbox: boolean;
    client: AuthorizationCode;
    accessToken?: AccessToken;
    conn?: jsforce.Connection;
}

type PublicConnectionDefinition = {
    alias: string;
    name: string;
    sandbox: boolean;
}

type PublicSesionDefinition = {
    currentConnection: number;
    connections: PublicConnectionDefinition[];
}

type SignInToken = {
    id: string;
    }

/**
 * @description Convert Base64 URL Safe to standard Base64
 * @param base64UrlSafe String Base64 URL Safe
 * @returns string Base64
 */
function fromBase64UrlSafe(base64UrlSafe: string): string {
    let base64 = base64UrlSafe
        .replace(/-/g, '+') // Replace - con +
        .replace(/_/g, '/'); // Rreplace _ con /
    
    // add padding with '='
    const padding = base64.length % 4;
    if (padding > 0) {
        base64 += '='.repeat(4 - padding);
    }
    const buffer = Buffer.from(base64, 'base64');

    return  buffer.toString('ascii');
}




export class Connection {
    private alias: string = "";
    private _name: string = "";
    private sandbox: boolean;
    private client: AuthorizationCode;
    private accessToken?: AccessToken;
    private conn?: jsforce.Connection;      
    private userInfo?: IdentityInfo;

    constructor(sandbox: boolean, url: string, clientId: string, clientSecret: string) {
        this.sandbox = sandbox;
         const authConfig: ModuleOptions = {
            client: {
                id: clientId,
                secret: clientSecret
            },
            auth: {
                tokenHost:  (sandbox) ? "https://test.salesforce.com" : "https://login.salesforce.com",
                tokenPath:  "/services/oauth2/token",
                authorizePath: "/services/oauth2/authorize"
            }
        };
        
        this.client = new AuthorizationCode(authConfig);
        this.conn = undefined; // Initialize conn property as undefined
    }

    authorizationUri(url: string): string  { 
        return this.client.authorizeURL({
            redirect_uri: url,
            scope: "api web id profile email",
        });         
    }

    async login(code: string, url: string, apiSfVersion: string ): Promise<void> {
        const tokenParams = {
            code: code,
            redirect_uri: url
        };

        this.accessToken= await this.client.getToken(tokenParams);
        this.alias = (this.sandbox) ? "sandbox" : "PROD";
        const regexp = /(?<=\/\/).*?(?=\.my|\.sandbox)/
        this.name = (this.accessToken.token.instance_url as string).match(regexp)![0];
        this.conn = new jsforce.Connection({
            instanceUrl: this.accessToken.token.instance_url as string,
            accessToken: this.accessToken.token.access_token as string,
            version: apiSfVersion
        });
        this.userInfo = await this.conn.identity();


    }
    
    getUserInfo(): IdentityInfo | undefined {
        console.log(this.userInfo?.username);
        return this.userInfo;
    }

    get name(): string {
        return this._name;
    }
    set name(value: string) {
        this._name = value;
    }

    getPublicDefinition(): PublicConnectionDefinition {
        return {
            alias: this.alias,
            name: this.name,
            sandbox: this.sandbox
        };
    }
    get connection(): jsforce.Connection {
        if (!this.conn) {
            throw new Error("Not connected");
        }
        return  this.conn;
    }
    
}



export class Session { 
    private currentConnection: number = 0;
    private connectionId: number = 0;
    private connections: Connection[] = new Array<Connection>();
    private apiSfVesion: string='58.0';

    constructor() {
        this.connectionId = Math.floor(Math.random() * 10000);
    }

    get id(): number {
        return this.connectionId;
    }

    /**
     * Gets the sign-in token.
     * @returns The sign-in token.
     */
    get signInToken(): string {
        console.info("signInToken Session: " + this.connectionId); // Log out 
        const token = Buffer.from(JSON.stringify({id: this.connectionId.toString()})).toString('base64'); 
        return token;
    }
    static decode(token: string): number {
        const id =  JSON.parse(Buffer.from(token, "base64").toString("ascii")).id;   
        return id
    }

    /**
     * Gets the session status as a base64 encoded string.
     * @returns The session status as a base64 encoded string.
     */
    get sessionStatus(): string {
        const result: PublicSesionDefinition = {
            currentConnection: this.currentConnection,
            connections: []
        };

        if (this.connections.length !== 0) {
            this.connections.forEach((connection)=> {  
                result.connections.push({...connection.getPublicDefinition()});
            });
        }
        return Buffer.from(JSON.stringify(result)).toString('base64');
    }


    requestAuthorization(sandbox: boolean, url: string, clientId: string, clientSecret: string ): string {
        const newConnection = new Connection(sandbox, url, clientId, clientSecret);
        this.connections[0]=newConnection;
        //this.currentConnection = this.connections.length - 1;
        return newConnection.authorizationUri(url);
    }


    async login(code: string, url: string, apiSfVesion: string): Promise<void> {
        this.apiSfVesion = apiSfVesion
        await this.connections[this.currentConnection].login(code, url, apiSfVesion);
    }

    getUserName() {
        this.connections[this.currentConnection].getUserInfo()?.username;
    }


    async doSOQL(orgSfName:string, query: Base64) : Promise<any>  {
        const decodedQuery = fromBase64UrlSafe(query);
        console.info("doSQL" + decodedQuery);
        const conn = getConnection(this.connections, orgSfName);
        try {
            return await conn.query(decodedQuery);
        } catch (error) {
            console.error('SOQL Error', (error as Error).message);
            throw new SessionError("SOQL Error: " + (error as Error).message);
        }

    }    


    async describeGlobal(orgSfName:string) : Promise<any>  {
        console.info(`describe ${orgSfName}`);
        const conn = getConnection(this.connections, orgSfName);
        try {
            return await conn.describeGlobal();
        } catch (error) {
            console.error('SOQL Error', (error as Error).message);
            const sessionError = new SessionError("SOQL Error: " + (error as Error).message);
            sessionError.stack = "No stack trace available";
            throw error;
        }
    }  
    async describeSObject(orgSfName:string, sobject:string) : Promise<any>  {
        console.info(`describe ${orgSfName} ${sobject} `);
        const conn = getConnection(this.connections, orgSfName);;
        try {
            return await conn.describe(sobject);
        } catch (error) {
            const sessionError = new SessionError((error as Error).message);
            sessionError.stack = "No stack trace available";
            throw error;
        }
    }      
    
    async describe(orgSfName:string) : Promise<any>  {
        console.info("describe");
        const swExist = this.connections.find((connection, index) => {connection.name === orgSfName; this.currentConnection = index;   return true;});
        if (!swExist) {
            throw new Error("Connection not found");
        }
        const conn = this.connections[this.currentConnection].connection;
        try {
            return await conn.metadata.describe(this.apiSfVesion);
        } catch (error) {
            console.error('describe Error', (error as Error).message);
            throw new SessionError("describe Error: " + (error as Error).message);
        }
    }      
    
    async getListmetadata() : Promise<any>  {
        console.info("getListmetadata");
        const conn = this.connections[this.currentConnection].connection;
        const params: jsforce.ListMetadataQuery[] = [{type: 'CustomObject'}];
        try {
            return await conn.metadata.list(params, this.apiSfVesion);
        } catch (error) {
            console.error('ListMetadata Error', (error as Error).message);
            throw new SessionError("ListMetadata Error: " + (error as Error).message);
        }
    }      
    
    async getObjectmetadata(orgSfName:string, sobject:string) : Promise<any>  {
        console.info("getListmetadata");
        const conn = getConnection(this.connections, orgSfName);

        try {
            const metadata:  MetadataInfo  = await conn.metadata.read("CustomObject",[sobject] ) as MetadataInfo ;
            return metadata.fields
                .map((field: any) => { return {name: field.fullName, description: field.description}; })
                .filter((field: any) => field.description !== undefined);
            
        } catch (error) {
            console.error('ObjectMetadata Error', (error as Error).message);
            throw new SessionError("ObjectMetadata Error: " + (error as Error).message);
        }
    }     
    
}

    
const getConnection = ( connections: Connection[], orgSfName:string) : jsforce.Connection => {
    let result=0;
    const swExist = connections.find((connection, index) => {
        result=index; 
        return (connection.name === orgSfName);
    });
    if (!swExist) {
        throw new Error("Connection not found");
    }       
    return connections[result].connection;    
}




export class Sessions {
    private sessions: Map<number, Session> = new Map<number, Session>();

    signIn() {
        const newSesion = new Session();
        this.sessions.set(newSesion.id, newSesion);
        console.info("New Session: " + newSesion.id); // Log out
        return newSesion.signInToken;
    }

    getSession(signInToken:string ): Session  {
        const id = Session.decode(signInToken)*1;
        if (!this.sessions.has(id)) {
            throw new SessionError("Session not found");
        }
        
        return this.sessions.get(id)!;
    }
    setConexion(id: number, conexion: any) {
        this.sessions.set(id, conexion);
    }
    deleteConexion(id: number) {
        this.sessions.delete(id);
    }
} 
