import { AccessToken, AuthorizationCode, ModuleOptions } from "simple-oauth2";
import jsforce, { IdentityInfo  } from "jsforce";
import { Session } from "./session";    
import { SessionError } from "./sessionError";
import { CLIENT_ID, CLIENTE_SECRET, CALLBACK_URL,  API_SF_VERSION } from './environment';
import { IsfUserEntity } from "./db/services/userEntity";






export type PublicConnectionDefinition = {
    alias: string;
    name: string;
    sandbox: boolean;
    isConnected: boolean;
    isError: boolean;

}

export type PublicSesionDefinition = {
    connections: PublicConnectionDefinition[];
    currentConnection: number | null;
}


export class Connection {
    private alias: string = "";
    private _name: string = "";
    private sandbox: boolean = false;
    private client: AuthorizationCode;
    private accessToken?: AccessToken;
    private conn?: jsforce.Connection;      
    private userInfo?: IdentityInfo;
    private mySession: Session;
    private instanceUrl: string = "";
    private isConnected: boolean = false;
    private isError: boolean = false;
    
    static createConnection(org: IsfUserEntity, session: Session): Connection {
        const organization = org.organizationEntity!.getRecord();
        console.log("Connection.createConnection: " + organization.orgName + " " + organization.instanceUrl);
        console.log(organization);
        const newConnection =  new Connection(organization.orgName, organization.instanceUrl, session);
        return newConnection;
    }


    constructor(orgName: string, url: string, session: Session) {
        this.mySession = session;
        this.instanceUrl = url;
        this.name = orgName;


        console.log("Connection: " + this.name + " " + this.instanceUrl);

        const authConfig: ModuleOptions = {
            client: {
                id: CLIENT_ID,
                secret: CLIENTE_SECRET
            },
            auth: {
                tokenHost:  this.instanceUrl,
                tokenPath:  "/services/oauth2/token",
                authorizePath: "/services/oauth2/authorize"
            }
        };
        
        this.client = new AuthorizationCode(authConfig);
        this.conn = undefined; // Initialize conn property as undefined
    }

    authorization(): string  { 
        return this.client.authorizeURL({
            redirect_uri: CALLBACK_URL,
            scope: "api web id profile email",
        });         
    }

    async login(code: string, url: string): Promise<void> {
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
            version: API_SF_VERSION
        });
        this.isConnected = true;
        this.userInfo = await this.conn.identity();
        
        await this.mySession.upsetUser(this.userInfo, this.accessToken.token.instance_url as string, this.name);
    }
    
    getUserInfo(): IdentityInfo | undefined {
        console.log(this.userInfo?.username);
        console.log(this.userInfo);
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
            sandbox: this.sandbox,
            isConnected: this.isConnected,
            isError: this.isError
        };
    }
    get connection(): jsforce.Connection {
        if (!this.conn) {
            throw new Error("Not connected");
        }
        return  this.conn;
    }

    /**
     * @description Close the connection
     * @returns void
     */
    close(): void {
        this.conn!.logout((error) => {
            if (error) {
                console.error("Error: " + error);
            }
        });
    }


    
    /**
     * Executes a SOQL query after decoding it from a Base64 URL-safe string.
     *
     * @param query - The Base64 URL-safe encoded SOQL query string.
     * @returns A promise that resolves with the query result.
     * @throws {SessionError} If there is an error executing the SOQL query.
     */
    async doSOQL(decodedQuery: string): Promise<jsforce.QueryResult<Record<string, unknown>>> {
        try {
            return await this.conn!.query(decodedQuery);
        } catch (error) {
            throw new SessionError("SOQL Error: " + (error as Error).message);
        }

    }       

    async describeGlobal() : Promise<jsforce.DescribeGlobalResult>  {
        try {
            return await this.conn!.describeGlobal();
        } catch (error) {
            const sessionError = new SessionError("describeGlobal(): " + (error as Error).message);
            throw sessionError;
        }
    }      
    

    async describe() : Promise<jsforce.DescribeMetadataResult>  {
        try {
            return await this.conn!.metadata.describe(API_SF_VERSION);
        } catch (error) {
            const sessionError = new SessionError("describe(): " + (error as Error).message);
            throw sessionError;
        }
    }   
    
    async describeSObject(sobject: string): Promise<jsforce.DescribeSObjectResult>  {
        try {
            return await this.conn!.describe(sobject);
        } catch (error) {
            const sessionError = new SessionError("describe(): " + (error as Error).message);
            throw sessionError;
        }
    }        

    
    async getListmetadata(type: string): Promise<jsforce.FileProperties[]>  {
        const params: jsforce.ListMetadataQuery[] = [{type}];
        try {
            return await this.conn!.metadata.list(params, API_SF_VERSION);
        } catch (error) {
            const sessionError = new SessionError(`getListmetadata(${type}): ${(error as Error).message}`);
            throw sessionError;
        }
    }    

    async getObjectmetadata(type: string, sobject:string) : Promise<jsforce.MetadataInfo | jsforce.MetadataInfo[]>  {
        try {
            const metadata  = await this.conn!.metadata.read(type,[sobject] );
            /*if (Array.isArray(metadata)) {
                return (metadata as jsforce.MetadataInfo[])
                    .map((field) => { return {name: field.fullName, description: field.description}; })
                    .filter((field) => field.description !== undefined);*/
                
            return metadata;   
            
        } catch (error) {
            const sessionError = new SessionError(`getObjectmetadata(${type}:${sobject}): ${(error as Error).message}`);
            throw sessionError;
        }
    }  




}

