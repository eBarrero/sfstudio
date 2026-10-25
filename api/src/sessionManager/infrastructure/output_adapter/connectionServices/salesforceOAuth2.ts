import { API_SF_VERSION } from "../../../../config/environment";
import { Connection, QueryResult } from "jsforce";
import { FileProperties, ListMetadataQuery, Metadata, MetadataType } from "jsforce/api/metadata";
import { ConnectionDriver } from './connectionDriver';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { SessionError } from '../../../domain/exceptions/sessionError';
import { SalesforceOAuthError } from '../../../domain/exceptions/salesforceOAuthError';
import { validateSalesforceLoginHost } from '../../../domain/entities/salesforceLoginHost';
import { SalesforceOAuthClient, LiveSalesforceOAuthClient } from './salesforceOAuthClient';

export default class salesforceOAuth2 extends ConnectionDriver {
    private conn?: Connection;     

    constructor(
        configDriverDTO: ConnectionDriverDTO,
        private readonly oauthClient: SalesforceOAuthClient = new LiveSalesforceOAuthClient(),
    ) {
        super(configDriverDTO);
    }


    public requestAuthorization(state: string): string {
        try {
            return this.oauthClient.authorizationUrl(
                validateSalesforceLoginHost(this.configDriverDTO.tech!, this.configDriverDTO.loginHost),
                state,
            );
        } catch {
            throw new SalesforceOAuthError();
        }
    }

    async login(): Promise<ConnectionDriverDTO> {
        try {
            const result = await this.oauthClient.exchangeCode(
                validateSalesforceLoginHost(this.configDriverDTO.tech!, this.configDriverDTO.loginHost),
                this.configDriverDTO.code!,
            );
            const instance = new URL(result.instanceUrl);
            if (instance.protocol !== 'https:' || !instance.hostname.endsWith('.salesforce.com')) {
                throw new Error('Invalid Salesforce instance');
            }
            const alias = instance.hostname.split('.')[0];
            const configured = new ConnectionDriverDTO({
                tech: this.configDriverDTO.tech,
                dbId: result.organizationId,
                dbName: alias,
                instanceUrl: instance.origin,
                userId: result.userId,
                userName: result.userName,
                email: result.email,
                alias,
                loginHost: this.configDriverDTO.loginHost,
            });
            this.conn = result.connection;
            this.isConnected = true;
            return configured;
        } catch {
            throw new SalesforceOAuthError();
        }
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


    async getDescribe() : Promise<string>  {
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
