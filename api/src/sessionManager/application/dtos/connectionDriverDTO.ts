import { createOrgKey } from '../../domain/entities/orgKey';
import { salesforceLoginHost, validateSalesforceLoginHost } from '../../domain/entities/salesforceLoginHost';

//type technology = "MongoDB" | "MySQL" | "PostgreSQL" | "SF_Prod" | "SF_Test" | "SalesforceAuth0";



export enum Technology {
    MongoDB = "MongoDB",
    MySQL = "MySQL",
    PostgreSQL = "PostgreSQL",
    SF_Prod = "SF_Prod",
    SF_Test = "SF_Test",
    SalesforceAuth0 = "SalesforceAuth0"
}

export function stringToTechnology(tech: string): Technology {
    switch (tech) {
        case "MongoDB": return Technology.MongoDB;
        case "MySQL": return Technology.MySQL;
        case "PostgreSQL": return Technology.PostgreSQL;
        case "SF_Prod": return Technology.SF_Prod;
        case "SF_Test": return Technology.SF_Test;
        case "SalesforceAuth0": return Technology.SalesforceAuth0;
        default: throw new Error("Technology not found");
    }
}   

export interface ConnectionDriverParams {
    tech: Technology | null;
    dbId?: string
    dbName?: string;
    instanceUrl?: string | null;
    callbackUrl?: string | undefined;
    code?: string | undefined;  // from Auth0 call back
    userId?: string;
    userName?: string;
    email?: string;
    alias?: string;
    loginHost?: string;
}

export class ConnectionDriverDTO {
    public readonly tech: Technology | null;
    public readonly dbId: string = "";
    public readonly dbName: string | null;
    public readonly instanceUrl: string | null | undefined;
    public readonly callbackUrl: string | undefined;
    public readonly code: string | undefined= "";
    public readonly userId: string = "";
    public readonly userName: string = "";
    public readonly email: string = "";
    public readonly alias: string = "";
    public readonly loginHost: string;
    

    constructor(params: ConnectionDriverParams | ConnectionDriverDTO) {
        this.tech = params.tech;
        this.dbId = params.dbId ?? "";
        this.dbName = (params.dbName===undefined) ? params.tech : params.dbName;
        this.instanceUrl = params.instanceUrl;
        this.callbackUrl = params.callbackUrl;
        this.code = params.code;
        this.userId = (params.userId===undefined) ? "" : params.userId;
        this.userName = (params.userName===undefined) ? "" : params.userName;
        this.email = (params.email===undefined) ? "" : params.email;
        this.alias = (params.alias===undefined) ? "" : params.alias;
        this.loginHost = this.isSalesforce()
            ? validateSalesforceLoginHost(this.tech!, params.loginHost ?? salesforceLoginHost(this.tech!))
            : '';
    

        if (!this.tech) {
            throw new Error("Tech not found");
        }
    }
    /**
     * Check if the connection is writable or not
     * fields rquestes: tech, dbName, instanceUrl
     * @returns boolean
     */
    isWritable(): boolean {
        return this.tech !== null && this.dbName !== null && this.instanceUrl !== null;
    }
    /**
     * expose the fileds should be write to the database
     * @returns object 
     */
    toDatabse(): object {
        if (!this.isWritable()) {
            throw new Error("Connection is not writable");
        }
        createOrgKey(this.dbId, this.userId);
        return {
            tech: this.tech,
            dbId: this.dbId,
            dbName: this.dbName,
            userId: this.userId,
            userName: this.userName,
            instanceUrl: this.instanceUrl,
            email: this.email,
            alias: this.alias,
            loginHost: this.loginHost,
            contractVersion: 1
        }
    }

    isSalesforce(): boolean         { return this.tech === Technology.SF_Test || this.tech === Technology.SF_Prod; }
    isSalesforceSandbox(): boolean  { return this.tech === Technology.SF_Test; }
    isSalesforceProd(): boolean     { return this.tech === Technology.SF_Prod; }
    isMongoDB(): boolean            { return this.tech ? this.tech.includes("MongoDB") : false; }
    isMySQL(): boolean              { return this.tech ? this.tech.includes("MySQL") : false; }
    isPostgreSQL(): boolean         { return this.tech ? this.tech.includes("PostgreSQL") : false; }
}
