import mongoose, {Schema} from "mongoose";

export interface IConnectedOrgs extends mongoose.Document {
    organizationName: string;
    owner: mongoose.Types.ObjectId[];
    createdAt?: Date;
}

// models/ConnectedOrgs
const ConnectedOrgsSchema = new Schema({
    organizationName: {
      type: String,
      required: true, 
      unique: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to user
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });


  export default mongoose.model<IConnectedOrgs>('ConnectedOrgs', ConnectedOrgsSchema);