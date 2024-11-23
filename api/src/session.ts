import { Connection, PublicSesionDefinition } from './connection';
import { SessionError } from './sessionError';
import userFactory from "./db/services/userFactory";
import UserEntity  from "./db/services/userEntity";
import OrgEntity from './db/services/orgEntity';

import { IdentityInfo  } from "jsforce";







export class Session { 
    private tokenId: number = 0;
    private userId: string = ''; // db id of the user
    private connections: Connection[] = new Array<Connection>();
    private userEntity?: UserEntity | null;
    private currentOrgSfName: string | null = null;

    constructor(tokenId: number | null) {
        if (!tokenId) {
            this.tokenId = this.tokenId = Math.floor(Math.random() * 1000000);
        } else {
            this.tokenId = tokenId;
        }
    }

    static async createSessionFromDB(tokenId: number): Promise<Session> {
        console.info("Get Session from DB: " + tokenId);
        const user = await userFactory.findUserByTokenId(tokenId);
        if (user) {
            const session = new Session(tokenId);
            session.userEntity = user;
            session.reloadConnections();
            return session;
        } else {
            throw new SessionError(`User not found with token ${tokenId}`);
        }
    }    

    private reloadConnections() {
        this.connections = [];
        this.userEntity!.getRecord().sfUsers.forEach((sfUser) => {
            this.connections.push(Connection.createConnection(sfUser, this));
        });
    }

    get id(): number {
        if (this.tokenId === 0) {
            throw new SessionError(`Token not value`);
        }
        return this.tokenId;
    }
    /**
     * Gets the sign-in token.
     * @returns The sign-in token.
     */
    get signInToken(): string {
        console.info("signInToken Session: " + this.tokenId); // Log out 
        const token = Buffer.from(JSON.stringify({id: this.tokenId.toString()})).toString('base64'); 
        return token;
    }

    public getConnection(orgSfName:string) : Connection {
        if (orgSfName === undefined) {
            return this.connections.at(-1)!;
        }

        const foundConnection = this.connections.find(connection => connection.name === orgSfName);
        if (!foundConnection) {
            throw new SessionError(`Connection with name "${orgSfName}" not found`);
        }
        return foundConnection;
    }


    /**
     * Gets the session status as a base64 encoded string.
     * @returns The session status as a base64 encoded string.
     */
    public getSessionStatus(): string {
        const result: PublicSesionDefinition = {
            connections: [],
            currentConnection: null
        };

        if (this.connections && this.connections.length !== 0) {
            this.connections.forEach((connection)=> {  
                const index = result.connections.push({...connection.getPublicDefinition()});
                if (this.currentOrgSfName && connection.name === this.currentOrgSfName) {
                    result.currentConnection = index;
                }
            });
        }
        return Buffer.from(JSON.stringify(result)).toString('base64');
    }

    /**
     * Requests Reuse or create a new connection to authorization for a Salesforce organization.
     * @param orgSfName - The Salesforce organization name.
     * @returns The URL to redirect to for authorization.
     */
    public requestAuthorization(orgSfName: string): string {
        const foundConnection = this.connections.find(connection => connection.name === orgSfName);
        if (foundConnection) {
            return foundConnection!.authorization();
        }

        const newConnection = new Connection(orgSfName, (orgSfName === 'test') ? 'https://test.salesforce.com' : 'https://login.salesforce.com', this);
        this.connections.push(newConnection);
        
        return newConnection.authorization();
    }

    /**
     * @description Search the org inside of user 
     * @param userInfo
     * @param url
     * @param orgSfName
     */
    private findOrgInUser(userInfo: IdentityInfo , url: string, orgSfName: string): void {
        if (!this.userEntity) {
            throw new SessionError(`User not loaded`);
        }
        console.log('findOrgInUser');
        const index =  this.userEntity.getRecord().sfUsers.findIndex( (sfuser) => sfuser.sfUserId);
        if (this.tokenId!==this.userEntity.getRecord().tokenId) {
            this.tokenId = this.userEntity.getRecord().tokenId;            
        }
        if (index===-1) {
            const newOrg = {
                sfUserId: userInfo.user_id,
                sfUserName: userInfo.username,
                email: userInfo.email,
                accessToken: '',
                expiresIn: 3600,
                organizationId: userInfo.organization_id,
                organizationEntity: new OrgEntity({organizationId: userInfo.organization_id, orgName: orgSfName, instanceUrl: url, connectedOrgsName: 'New connected Org\'s'}),
                refreshToken: ''
                
            }
            this.userEntity.addSfUser(newOrg);
            
        }
    }





    /**
     * @description Create or update the user in the database with the information from the Salesforce user
     *              - check if the user exists in the database (use case: user logs in other device)
     * @param userInfo 
     * @param url 
     * @param orgSfName 
     */
    public async upsetUser(userInfo: IdentityInfo , url: string, orgSfName: string) {
        console.log('upsetUser');
        this.currentOrgSfName = orgSfName;
        if (this.userEntity) {
            this.findOrgInUser(userInfo, url, orgSfName);
        } else {
            this.userEntity = await userFactory.findUserBySfUserNameOreMail(userInfo.username, userInfo.email);   // or email 
            if (this.userEntity) {
                console.log(`tokenid: ${this.tokenId}`);
                console.log(`userEntity: ${this.userEntity.getRecord().tokenId}`);
                this.tokenId = this.userEntity.getRecord().tokenId;              // update tokenid from existing user
                this.findOrgInUser(userInfo, url, orgSfName);
            } else {      
                this.userEntity = userFactory.createUserFromConnection(userInfo, this.tokenId, orgSfName, url);
            }      
            return this.userEntity;
        }
        

    }












/*
        if (!this.user) {
           
            if (this.user) {
                this.tokenId = this.user.getRecord().token;  // update tokenid from existing user
            } else {
                const org = await orgFactory.upsetOrg({
                    organizationId: userInfo.organization_id,
                    orgName: orgSfName,
                    instanceUrl: url
                });
                
                const newUser: IUser  = {
                    token: this.tokenId,
                    name:  userInfo.display_name,
                    sfUsers: [{ 
                        sfUserId: userInfo.user_id,
                        sfUserName: userInfo.username,
                        email: userInfo.email,
                        accessToken: this.tokenId.toString(),
                        expiresIn: 3600,
                        organization: new OrgEntity({name: orgSfName, url: url}).getRecord()._id,
                        refreshToken: ''
                    }]
                }    
                this.user = await userFactory.createUser(newUser);
            } 
        }

        const sfUser = this.user.getRecord().sfUser.find(sfUser => sfUser.userName === userInfo.username);

        sfUsers: [{ userId: userInfo.user_id, 
            userName: userInfo.username, 
            email: userInfo.email, 
            accessToken: this.tokenId.toString(), 
            expiresIn: 3600, 
            refreshToken: '', 
            createdAt: new Date() }], 


    }*/
}

    







