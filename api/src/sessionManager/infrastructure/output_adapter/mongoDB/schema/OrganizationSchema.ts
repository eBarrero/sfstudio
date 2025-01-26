import mongoose, {connect, Schema} from "mongoose";

export interface IOrganization extends mongoose.Document {
    organizationId: string;
    orgName: string;
    instanceUrl: string;
    connectedOrgsName: string;
    createdAt?: Date;
}


// models/Organization
const OrganizationSchema = new Schema({
    // from Salesforce.com Organization ID
    organizationId: {
      type: String,
      required: true,
      unique: true, 
    },
    // from first part of the Salesforce.com instance URL 
    orgName: {
      type: String,
      required: true, 
      unique: true,
    },
    instanceUrl: {
      type: String,
      required: true,
    },  
    // reference to the connected org
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to user
    },
    connectedOrgsName: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  export default mongoose.model<IOrganization>('Organization', OrganizationSchema);