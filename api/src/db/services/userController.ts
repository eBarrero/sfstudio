import mongoose from "mongoose";
import User, {IUser, IsfUser} from "../schema/UserSchema";
import Organization, {IOrganization} from "../schema/OrganizationSchema";

import controller from "./../controller"; 
import UserEntity from "./userEntity";

import dbError from "../dbError";





class UserController {


    public async create (userEntity: UserEntity ): Promise<boolean> {
        try {
            controller.connect();
            const userData = userEntity.getRecord();
            
            if (userData.sfUsers.length === 0) {
                throw new Error(`User must have at least one sfUser`);
            }

            const sfUser: IsfUser[] = [];
            const sfUserData = userData.sfUsers[0];
            const sfUserdb: IsfUser = {
                sfUserId: sfUserData.sfUserId,
                sfUserName: sfUserData.sfUserName,
                email: sfUserData.email,
                accessToken: sfUserData.accessToken,
                expiresIn: sfUserData.expiresIn,
                refreshToken: sfUserData.refreshToken,
                organizationId: sfUserData.organizationId
            };
            sfUser.push(sfUserdb);


            const userdb = {
                _id: new mongoose.Types.ObjectId(),
                createdAt: new Date(),
                sessionTokenId: userData.tokenId,
                name: userData.name,
                sfUsers: sfUser,
            } as IUser;

            const user = await new User(userdb).save();
            console.log(`User created: ${user._id}`);
            console.log('sfUserData:', sfUserData);
            const orgEntity = sfUserData.organizationEntity;
            const orgData = orgEntity!.getRecord();

            const orgdb = {
                _id: new mongoose.Types.ObjectId(),
                organizationId: orgData.organizationId,
                orgName: orgData.orgName,
                instanceUrl: orgData.instanceUrl,
                connectedOrgsName: orgData.connectedOrgsName,
                createdAt: new Date()
            } as IOrganization

            await new Organization(orgdb).save();

        } catch (error) {
            throw new dbError(`save(${userEntity.getRecord()}): ${(error as Error).message}`);
        }
        return true;
    }
}



export default new UserController();