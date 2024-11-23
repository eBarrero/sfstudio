import OrgEntity from "./orgEntity"; 


export interface IsfUserEntity {
    sfUserId: string,
    sfUserName: string,
    email: string,
    accessToken?: string,
    expiresIn: number,
    organizationId: string,
    organizationEntity?: OrgEntity
    refreshToken: string    
}

export interface IUserEntity {
    _id?: string;
    createdAt: Date,
    tokenId: number
    name:  string
    sfUsers: IsfUserEntity[]
}



export default class UserEntity {
    private user: IUserEntity;

    constructor(user: IUserEntity) {
        this.user = user;
    }



    /**
     * @description: returns the current user record
     * @returns {IUser}
     */
    public getRecord(): IUserEntity {
        //return  structuredClone(this.user);
        return this.user;
    }   

    /**
     * @description: add new sfUser to the user
     * @param newOrg - the new sfUser to add
     */
    addSfUser(newOrg: IsfUserEntity): void {
        console.log("Adding new sfUser: " + newOrg.sfUserName);
        this.user.sfUsers.push(newOrg);
    } 

}
