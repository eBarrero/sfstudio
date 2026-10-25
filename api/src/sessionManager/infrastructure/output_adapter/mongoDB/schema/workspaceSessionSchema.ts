import { Connection, Document, Schema, Types } from "mongoose";
import { SessionId } from "../../../../domain/entities/workspaceSession";

export interface IWorkspaceSession extends Document {
    sessionId: SessionId;
    user: Types.ObjectId;
    expiresAt: Date;
}

const WorkspaceSessionSchema = new Schema<IWorkspaceSession>({
    sessionId: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
});

export const getWorkspaceSessionSchema = (connection: Connection) =>
    connection.model<IWorkspaceSession>("WorkspaceSession", WorkspaceSessionSchema);
