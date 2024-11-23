/* mongoose controller */
import mongoose from 'mongoose';
import User, {IUser} from './schema/UserSchema';
import Organization, { IOrganization } from './schema/OrganizationSchema';
import ConnectedOrgs, { IConnectedOrgs} from './schema/ConnectedOrgs';
import dbError from './dbError';



const uri = "mongodb+srv://eugeniobarrero:2Vzy22Ck0wNzTKpX@cluster0.jw6uq.mongodb.net/sfstudioDB?retryWrites=true&w=majority&appName=Cluster0";
const clientOptions: mongoose.ConnectOptions = { serverApi: { version: "1", strict: true, deprecationErrors: true } };


async function connect() {
  console.log("Connecting to MongoDB...");
  try {  
    if (mongoose.connection.readyState!==0) {
      console.log("Already connected to MongoDB " + mongoose.connection.readyState);
      return;
    }
    await mongoose.connect(uri, clientOptions);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    throw new Error("Error connecting to MongoDB: " + (error as Error).message);
    console.error("Error connecting to MongoDB: ", error);   
  }
}

/*
async function close() {
  await mongoose.disconnect();
}*/






 class Controller {
  /**
   * @description find an user by id and return an UserEntity instance
   * @param userId - the id of the user
   * @returns an UserEntity instance if the user is found, empty instance otherwise
   */
  public async connect() {
    connect();
  }

  public async close() {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error("Error disconnecting from MongoDB: ", error);
    }
  }
  
  public async getUserById(userId: string) {
    connect();
    const id = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(id).exec();
    if (user) {
      return user;
    }
    throw new dbError(`getUserById(${userId}): User not found`);
  }
  
  public async getUserByTokenId(tokenId: number) {
    connect();
    const user = await User.findOne({ sessionTokenId: tokenId }).exec();
    if (user) {
      return user;
    } 
    return null;
  }

  public async findUserBySfUserNameOreMail(sfUserName: string, email: string) : Promise<IUser | null> {
    connect();
    //.populate("Organization")
    const user = await User.findOne({ sfUsers: { $elemMatch: { $or:[ {sfUserName: sfUserName}, {email}] }}}).exec();
    return (user) ? user : null;    
  }

/**
 * @description create a new user and return an UserEntity instance
 * @param userData Partial<IUser> - the data of the user
 * @returns an UserEntity instance
 */
  public async createUser(userData: Partial<IUser>) {
    connect();
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      throw new dbError(`createUser(${userData}): ${(error as Error).message}`);
    }
  }
 
  /**
   * @description find an organization by organizationId and return an OrgEntity instance
   * @param organizationId - the organizationId of the organization
   * @returns an OrgEntity instance
   * @throws dbError if the orhanization is not found
   */
  public async getOrgByOrganizationBySfId(organizationId: string): Promise<IOrganization | null> {
    connect();
    try {
      const org = await Organization.findOne({
        organizationId: organizationId
      }).exec();
      return (org) ? org : null;
    } catch (error) {
      throw new dbError(`getOrgByOrganizationId(${organizationId}): ${(error as Error).message}`);
    }
  }



  /**
   * @description find an organization by url and return an OrgEntity instance
   * @param url - the url of the organization
   * @returns an OrgEntity instance if the organization is found, empty instance otherwise
   */
  public async getOrgByUrl(url: string): Promise<IOrganization | null> {
    connect();
    try {
      const org = await Organization.findOne({ instanceUrl:url}).populate("ConnectedOrgs").exec();
      return (org) ? org : null;
    } catch (error) {
      throw new dbError(`getOrgByUrl(${url}): ${(error as Error).message}`);
    }
  }

  /**
   * @description create or read an organization and return an OrgEntity instance
   * @param orgData - the data of the organization
   * @returns an OrgEntity instance
   */
  public async createOrg(orgData: Partial<IOrganization>) : Promise<IOrganization> {
    connect();
    try {
      const org = await Organization.create(orgData);
      return org;
    } catch (error) {
      throw new dbError(`createOrg(${orgData}): ${(error as Error).message}`);
    }
  }

  /**
   * @description find a connectedOrgs by id and return an ConnectedOrgsEntity instance
   * @param name - the id of the connectedOrgs in string format
   */
  public async getConnectedOrgsByName(name: string): Promise<IConnectedOrgs | null> {
    connect();
    try {
      const connectedOrgs = await ConnectedOrgs.findOne({organizationName: name}).exec();
      return (connectedOrgs) ? connectedOrgs : null;
    } catch (error) {
      throw new dbError(`getConnectedOrgsByName(${name}): ${(error as Error).message}`);
    }
  }


  /**
   * @description create or read a connectedOrgs and return an ConnectedOrgsEntity instance
   * @param connectedOrgsData - the data of the connectedOrgs
   * @returns an ConnectedOrgsEntity instance
   */
  
  public async createConnectedOrgs(organizationName: string | null) {
    connect();
    try {
      console.log("createConnectedOrgs: " + organizationName);
      return null
    } catch (error) {
      throw new dbError(`createConnectedOrgs(${organizationName}): ${(error as Error).message}`);
    }
  }
}


export default new Controller();