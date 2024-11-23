import mongoose from "mongoose";
const Schema = mongoose.Schema;



export interface IsfUser {
  sfUserId: string;
  sfUserName: string;
  email: string;
  accessToken?: string;
  expiresIn: number;
  refreshToken?: string;
  organizationId: string;
}

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  sessionTokenId: number;
  name: string;
  sfUsers: IsfUser[]; 
  createdAt: Date;
}



// Define the User schema
const UserSchema = new Schema({
  sessionTokenId: {
    type: Number,
    required: true,
    unique: true, // Ensure tokens are unique
  },
  name: {
    type: String,
    required: true,
  },
  sfUsers: [{
    // from SF: User.id
    sfUserId: {
      type: String,
      required: true,
      unique: true, 
    },
    // from SF: User.UserName
    sfUserName: {
      type: String,
      required: true, 
      unique: true,
    },
    // from SF: User.Email
    email: {
      type: String,
      required: true,
      unique: true,
    },
    accessToken: {
      type: String,
      //required: true,
    },
    expiresIn: {
      type: Number,
      required: true,
    },
    refreshToken: {
      type: String, 
    },
    organizationId: {
      type: String,
      required: true,
    }    
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

// Export the User model
export default mongoose.model<IUser>('User', UserSchema);
