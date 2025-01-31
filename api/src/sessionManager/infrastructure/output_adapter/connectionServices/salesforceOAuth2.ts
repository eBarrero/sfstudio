import { CLIENT_ID, CLIENTE_SECRET, CALLBACK_URL, API_SF_VERSION } from "../../../../config/environment";
import { AccessToken, AuthorizationCode, ModuleOptions } from "simple-oauth2";
import jsforce,  { Connection, QueryResult    } from "jsforce"; //DescribeGlobalResult, DescribeSObjectResult
import { FileProperties, ListMetadataQuery, Metadata, MetadataType } from "jsforce/api/metadata";
// DescribeMetadataResult
import { ConnectionDriver } from './connectionDriver';
import { ConnectionDriverDTO, Technology } from '../../../application/dtos/connectionDriverDTO';
import { SessionError } from '../../../domain/exceptions/sessionError';

export default class salesforceOAuth2 extends ConnectionDriver {
    private sandbox: boolean = false;
    private client?: AuthorizationCode;
    private accessToken?: AccessToken;
    private conn?: Connection;     
    private instanceUrl: string | null = '';
    

    constructor(configDriverDTO: ConnectionDriverDTO) {
        super(configDriverDTO);
    }


    public requestAuthorization(): string {
        this.instanceUrl = this.configDriverDTO.instanceUrl!;
        let urlExtra = '';
        let state = '';
        if (!this.instanceUrl) {
            urlExtra = "&prompt=login";
            state = this.configDriverDTO.tech!;
            this.instanceUrl = (this.configDriverDTO.isSalesforceSandbox()) ? "https://test.salesforce.com" : "https://login.salesforce.com";
        } else {
            state= this.configDriverDTO.dbName!;
        };

        const authConfig: ModuleOptions = {
            client: {
                id: CLIENT_ID,
                secret: CLIENTE_SECRET
            },
            auth: {
                tokenHost:   this.instanceUrl,
                tokenPath:  "/services/oauth2/token",
                authorizePath: "/services/oauth2/authorize"
            }
        };

        const auth0 = new AuthorizationCode(authConfig);

        let  url =  auth0.authorizeURL({
            redirect_uri: CALLBACK_URL,
            scope: "api web id profile email",
            state: state
        }); 

        url+= urlExtra; 
        console.log(`requestAuthorization URL: ${url}`);
        this.client = undefined
        return url;  
    }

    async login(): Promise<ConnectionDriverDTO> {    

        const oauth2 = new jsforce.OAuth2({
            loginUrl: "https://test.salesforce.com",
            clientId: CLIENT_ID,
            clientSecret: CLIENTE_SECRET,
            redirectUri: CALLBACK_URL,

          });
          
        this.conn = new jsforce.Connection({ oauth2: oauth2 });
        await this.conn.authorize(this.configDriverDTO.code!);
        const userInfo = await this.conn.identity()

        const regexp = /(?<=\/\/).*?(?=\.my|\.sandbox)/
        const name = (this.conn.instanceUrl as string).match(regexp)![0];
        this.isConnected = true;

       
        
        console.log(`Name: ${name} `);

        return new ConnectionDriverDTO({
            tech: Technology.SalesforceAuth0,
            dbId: userInfo.organization_id,
            dbName: name,
            instanceUrl: this.conn.instanceUrl as string,
            code: this.configDriverDTO.code,
            userId: userInfo.user_id,
            userName: userInfo.username,
            email: userInfo.email,
            callbackUrl: CALLBACK_URL,
            alias: name
        });
    }

  

    public async getDescribeGlobal() : Promise<string>  {
        try {
            const describeGlobalResult = await this.conn!.describeGlobal();
            return JSON.stringify(describeGlobalResult);
        } catch (error) {
            const sessionError = new SessionError("describeGlobal(): " + (error as Error).message);
            throw sessionError;
        }
    }      
    

    
    public async describeSObject(sobject: string): Promise<string>  {
        console.log("describeSObject");
        try {
            const describeSObjectResult = await this.conn!.describe(sobject);
            return JSON.stringify(describeSObjectResult);

        } catch (error) {
            const sessionError = new SessionError("describe(): " + (error as Error).message);
            throw sessionError;
        }
    }        



    /**
     * Executes a SOQL query after decoding it from a Base64 URL-safe string.
     *
     * @param query - The Base64 URL-safe encoded SOQL query string.
     * @returns A promise that resolves with the query result.
     * @throws {SessionError} If there is an error executing the SOQL query.
     */
    public async doSOQL(decodedQuery: string): Promise<string> {
        try {
            const rows: QueryResult<Record<string, unknown>> = await this.conn!.query(decodedQuery);
            return JSON.stringify(rows);

        } catch (error) {
            throw new SessionError("SOQL Error: " + (error as Error).message);
        }

    }     


    async getDescribe() : Promise<string>  {  // DescribeMetadataResult
        console.log("getDescribe");
        try {
            const r =  await this.conn!.metadata.describe(API_SF_VERSION);
            return JSON.stringify(r);
        } catch (error) {
            const sessionError = new SessionError("describe(): " + (error as Error).message);
            throw sessionError;
        }
    }   




    
    async getListmetadata(type: string): Promise<FileProperties[]>  {
        const params: ListMetadataQuery[] = [{type}];
        try {
            return await this.conn!.metadata.list(params, API_SF_VERSION);
        } catch (error) {
            const sessionError = new SessionError(`getListmetadata(${type}): ${(error as Error).message}`);
            throw sessionError;
        }
    }    

        async getObjectmetadata(type: string, sobject:string) : Promise<Metadata  | Metadata[]>  {
        try {
            const metadata  = await this.conn!.metadata.read(type as MetadataType, sobject);
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