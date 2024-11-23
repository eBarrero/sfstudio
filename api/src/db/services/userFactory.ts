import controller from "../controller";
import userController from "./userController";
import {IUser} from "../schema/UserSchema"
import UserEntity, {IUserEntity} from "./userEntity";
import OrgEntity from "./orgEntity";
import OrgFactory from "./orgFactory";
import dbError from "../dbError";
import { IdentityInfo  } from "jsforce";



class UserFactory {


    /**
     * @description: converts a user object to a UserEntity instance
     * @param user - the user object
     * @returns 
     */
    public async createFromDB(user: IUser): Promise<UserEntity> {
        console.log('createFromDB', user.name);
        const userEntityRecord: IUserEntity = {
            _id: user._id.toString(),
            createdAt: user.createdAt,
            tokenId: user.sessionTokenId,
            name: user.name,
            sfUsers: await Promise.all(user.sfUsers.map(async (sfUser) => {
                return {
                    sfUserId: sfUser.sfUserId,
                    sfUserName: sfUser.sfUserName,
                    email: sfUser.email,
                    accessToken: sfUser.accessToken,
                    expiresIn: sfUser.expiresIn,
                    organizationId: sfUser.organizationId,
                    organizationEntity: await OrgFactory.findOrgByOrganizationId(sfUser.organizationId),                    
                    refreshToken: sfUser.refreshToken || ''
                }
            }))
        };

        return new UserEntity(userEntityRecord);
    }





    /**
     * @descriptiion find an user by tokenId and return an UserEntity instance
     * @param tokenId - the tokenId of the user
     * @returns an UserEntity instance if the user is found, empty instance otherwise
     */
    public async findUserByTokenId(tokenId: number): Promise<UserEntity | null> {    
        try {
            const user = await controller.getUserByTokenId(tokenId);

            if (user) {
                return this.createFromDB(user);
            }
            return null;
        } catch (error) {
            throw new dbError(`findUserByTokenId(${tokenId}): ${(error as Error).message}`);
        }
    }
    /**
     * @description find an user by userName y return an UserEntity instance
     * @param userName - the email of the user
     * @returns an UserEntity instance if the user is found, empty instance otherwise
     */
    public async findUserBySfUserNameOreMail(sfUserName: string, email: string): Promise<UserEntity | null> {    
        console.log('findUserBySfUserNameOreMail', sfUserName, email);
        try {
            const user = await controller.findUserBySfUserNameOreMail(sfUserName, email);
            if (user) {
                return this.createFromDB(user);
            }
            return null;
        } catch (error) {
            throw new dbError(`findUserByUserName($sfUserName}): ${(error as Error).message}`);
        }
    }
    /**
     * @description create a new user and return an UserEntity instance
     * @param email - the email of the user
     * @param password - the password of the user
     * @returns an UserEntity instance
     */
    public  createUserFromConnection(userInfo: IdentityInfo, tokenId: number, orgSfName: string, url: string): UserEntity {
        console.log('createUserFromConnection', userInfo);
        console.log('token', tokenId);
        try {
            const userEntityRecord: IUserEntity = {
                createdAt: new Date(),
                tokenId: tokenId,
                name: userInfo.display_name,
                sfUsers: [{
                    sfUserId: userInfo.user_id,
                    sfUserName: userInfo.username,
                    email: userInfo.email,
                    accessToken: '',
                    expiresIn: 3600,
                    organizationId: userInfo.organization_id,
                    organizationEntity: new OrgEntity({organizationId: userInfo.organization_id, orgName: orgSfName, instanceUrl: url, connectedOrgsName: 'New connected Org\'s'}),
                    refreshToken: ''
                }]
            }
            const newUser = new UserEntity(userEntityRecord);
            userController.create(newUser);

            


            return newUser; 
        } catch (error) {
            throw new dbError(`createUserFromConnection(${userInfo.username}): ${(error as Error).message}`);
        }
    }

  
}

export default new UserFactory();
