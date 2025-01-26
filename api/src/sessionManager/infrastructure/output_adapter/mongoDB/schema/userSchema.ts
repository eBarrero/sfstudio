import { Document, Schema, Types, Connection } from "mongoose";

export interface IConnection {
  tech: string;
  userId: string;
  userName: string;
  email: string;
  dbId: string;
  dbName: string;
  instanceUrl: string;
  alias: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  sessionId: number;
  name: string;
  createdAt: Date;
  connections: IConnection[]; 
}

// Define the User schema
const UserSchema = new Schema({
  sessionId: {
    type: Number,
    required: true,
    unique: true, // Ensure tokens are unique
  },
  name: {     type: String,    required: true,  },
  createdAt: {    type: Date,    default: Date.now,  },  
  connections: [{    
    tech:       { type: String, required: true,  },
    userId:     { type: String, required: true,  unique: true,    },
    userName:   { type: String, required: true,  unique: true,    },
    email:      { type: String, required: false   },
    dbName:     { type: String, required: true,   },
    dbId:       { type: String, required: false,  },
    instanceUrl:{ type: String, required: false,  },
    alias:      { type: String, required: true,   }
  }]


});


export const getUserSchema = (connection: Connection) => connection.model<IUser>('User', UserSchema);

