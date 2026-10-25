import { Model, Types } from 'mongoose';
import { MongoDBService }  from '../../../../infrastructure/DBs/mongoDBService';
import { UserRepositoryPort } from '../../../domain/ports/outbound/userRepositoryPort';
import { getUserSchema, IUser, IConnection }  from './schema/userSchema';
import { getWorkspaceSessionSchema, IWorkspaceSession } from './schema/workspaceSessionSchema';
import { ConnectionDriverDTO, ConnectionDriverParams, stringToTechnology } from '../../../application/dtos/connectionDriverDTO';
import { UserDTO } from '../../../application/dtos/userDTO';
import { SessionError, ErrorMessages } from '../../../domain/exceptions/sessionError';
import {
    createSessionId,
    SessionId,
    WORKSPACE_SESSION_TTL_MS,
} from '../../../domain/entities/workspaceSession';
import { createOrgKey } from '../../../domain/entities/orgKey';
import { migrateConnections } from './connectionMigration';
import { removeObsoleteWorkspaceOwnerIndex } from './workspaceIndexMigration';

export class MongoDBUserRepository  implements UserRepositoryPort {
    private userModel: Model<IUser>;
    private workspaceSessionModel: Model<IWorkspaceSession>;
    private workspaceIndexMigration?: Promise<void>;
    
    constructor(mongoDB: MongoDBService) {
        const connection = mongoDB.getConnection();
        this.userModel = getUserSchema(connection);
        this.workspaceSessionModel = getWorkspaceSessionSchema(connection);
    }

    public async findUserByTokenId(sessionId: SessionId): Promise<UserDTO> {
        const workspaceSession = await this.findActiveSession(sessionId);
        const user = await this.userModel.findById(workspaceSession.user);

        if (!user) {
            await this.workspaceSessionModel.deleteOne({ _id: workspaceSession._id });
            throw new SessionError(ErrorMessages.SESSION_INVALID);
        }

        return this.createUserDTO(user, workspaceSession);
    }

    /**
     * @description findUSerByUserId
     * @param configDriverDTO 
     * @returns 
     */
    public async findUserByUserId(configDriverDTO: ConnectionDriverDTO): Promise<UserDTO | null> {
        const user = await this.userModel.findOne({
            connections: { $elemMatch: { dbId: configDriverDTO.dbId, userId: configDriverDTO.userId } },
        });
        if (!user) {
            return null;
        }

        // A new OAuth flow without a workspace cookie must never reuse another
        // browser's live workspace session, even for the same Salesforce user.
        const workspaceSession = await this.createWorkspaceSession(user._id);
        return this.createUserDTO(user, workspaceSession);
    }

    /**
     * @description create a UserDTO from a IUser
     * @param user 
     * @returns 
     */
    private async createUserDTO(user: IUser, workspaceSession: IWorkspaceSession): Promise<UserDTO> {
        const configDriverDTOs:  ConnectionDriverDTO[] = [];
        const migration = migrateConnections(user.connections);
        if (migration.changed) {
            await this.userModel.updateOne({ _id: user._id }, { $set: { connections: migration.connections } });
        }
        migration.connections.forEach(connection => {
            const params: ConnectionDriverParams = {
                tech: stringToTechnology(connection.tech),
                dbId: connection.dbId,
                dbName: connection.dbName,
                userId: connection.userId,
                userName: connection.userName,
                email: connection.email,
                instanceUrl: connection.instanceUrl,
                alias: connection.alias,
                loginHost: connection.loginHost,
            };
            configDriverDTOs.push(new ConnectionDriverDTO(params));
        });
        
        const userDTO = new UserDTO(
            workspaceSession.sessionId,
            user.name,
            user.createdAt,
            workspaceSession.expiresAt,
            configDriverDTOs,
        );

        return userDTO;
    }

    public async createUserAndFirstConnection(sessionId: SessionId, expiresAt: Date, configDriverDTO: ConnectionDriverDTO): Promise<void> {
        await this.ensureWorkspaceIndex();
        const user = new this.userModel({
            sessionId: createSessionId(),
            name: 'userName',
            connections: [configDriverDTO.toDatabse() as IConnection]
        });
        await user.save();
        await new this.workspaceSessionModel({
            sessionId,
            user: user._id,
            expiresAt,
        }).save();
    }   
    public async addNewConnectionToUser(sessionId: SessionId, configDriverDTO: ConnectionDriverDTO): Promise<UserDTO> {
        const workspaceSession = await this.findActiveSession(sessionId);
        const user = await this.userModel.findById(workspaceSession.user);
        if (!user) {
            throw new SessionError(ErrorMessages.SESSION_INVALID);
        }   
        
        const key = createOrgKey(configDriverDTO.dbId, configDriverDTO.userId);
        const migration = migrateConnections(user.connections);
        const existingIndex = migration.connections.findIndex(row => createOrgKey(row.dbId, row.userId) === key);
        if (existingIndex < 0) migration.connections.push(configDriverDTO.toDatabse() as IConnection);
        else migration.connections[existingIndex] = configDriverDTO.toDatabse() as IConnection;
        await this.userModel.updateOne({ _id: user._id }, { $set: { connections: migration.connections } });
        const updatedUser = await this.userModel.findById(user._id);
        if (!updatedUser) throw new SessionError(ErrorMessages.SESSION_INVALID);
        return this.createUserDTO(updatedUser, workspaceSession);
    }

    public async rotateSessionId(previousId: SessionId, sessionId: SessionId, expiresAt: Date): Promise<void> {
        const result = await this.workspaceSessionModel.updateOne(
            { sessionId: previousId },
            { $set: { sessionId, expiresAt } },
        );

        if (result.matchedCount !== 1) {
            throw new SessionError(ErrorMessages.SESSION_INVALID);
        }
    }

    private async findActiveSession(sessionId: SessionId): Promise<IWorkspaceSession> {
        const workspaceSession = await this.workspaceSessionModel.findOne({ sessionId });

        if (!workspaceSession || workspaceSession.expiresAt.getTime() <= Date.now()) {
            if (workspaceSession) {
                await this.workspaceSessionModel.deleteOne({ _id: workspaceSession._id });
            }
            throw new SessionError(ErrorMessages.SESSION_INVALID);
        }

        return workspaceSession;
    }

    private async createWorkspaceSession(user: Types.ObjectId): Promise<IWorkspaceSession> {
        await this.ensureWorkspaceIndex();
        return new this.workspaceSessionModel({
            sessionId: createSessionId(),
            user,
            expiresAt: new Date(Date.now() + WORKSPACE_SESSION_TTL_MS),
        }).save();
    }

    /** Remove only the obsolete unique owner index; one user may have many workspaces. */
    private async ensureWorkspaceIndex(): Promise<void> {
        if (!this.workspaceIndexMigration) {
            this.workspaceIndexMigration = (async () => {
                await removeObsoleteWorkspaceOwnerIndex(this.workspaceSessionModel);
            })().catch(error => {
                this.workspaceIndexMigration = undefined;
                throw error;
            });
        }
        await this.workspaceIndexMigration;
    }
}
