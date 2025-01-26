import { Model } from 'mongoose';
import { mongoDBService }  from '../../../../infrastructure/DBs/mongoDBService';
import { UserRepositoryPort } from '../../../domain/ports/outbound/userRepositoryPort';
import { getUserSchema, IUser, IConnection }  from './schema/userSchema';
import { ConnectionDriverDTO, ConnectionDriverParams, stringToTechnology } from '../../../application/dtos/connectionDriverDTO';
import { UserDTO } from '../../../application/dtos/userDTO';
import { SessionError, ErrorMessages } from '../../../domain/exceptions/sessionError';

export class MongoDBUserRepository  implements UserRepositoryPort {
    private userModel: Model<IUser>;    
    
    constructor( private mongoDB: mongoDBService) {
        this.userModel = getUserSchema(mongoDB.getConnection());  
    }

    public async findUserByTokenId(sessionId: number) : Promise<UserDTO> {
        console.log(`findUserByTokenId ${sessionId}`);
        const user  = await this.userModel.findOne({ sessionId: sessionId });
        if (!user) {
            throw new SessionError(ErrorMessages.USER_NOT_FOUND);
        }
        return this.createUserDTO(user);
    }

    /**
     * @description findUSerByUserId
     * @param configDriverDTO 
     * @returns 
     */
    public async findUserByUserId(configDriverDTO: ConnectionDriverDTO): Promise<UserDTO | null> {
        console.log(`findUserByUserId ${configDriverDTO.userId}`);
        const user  = await this.userModel.findOne({ 'connections.userId': configDriverDTO.userId });
        if (!user) {
            return null
        }
        return this.createUserDTO(user);
    }

    /**
     * @description create a UserDTO from a IUser
     * @param user 
     * @returns 
     */
    private createUserDTO(user: IUser): UserDTO {
        const configDriverDTOs:  ConnectionDriverDTO[] = [];
        
        user.connections.forEach(connection => {
            const params: ConnectionDriverParams = {
                tech: stringToTechnology(connection.tech),
                dbId: connection.dbId,
                dbName: connection.dbName,
                userId: connection.userId,
                userName: connection.userName,
                email: connection.email,
                instanceUrl: connection.instanceUrl,
                alias: connection.alias
            };
            configDriverDTOs.push(new ConnectionDriverDTO(params));
        });
        
        const userDTO = new UserDTO(user.sessionId, user.name, user.createdAt, configDriverDTOs);             

        return userDTO;
    }

    public async crateUserAndFirstConnection(sessionId: number, configDriverDTO: ConnectionDriverDTO ): Promise<void> {
        console.log(`crateUserAndFirstConnection ${sessionId}`);
        try {
            const user = new this.userModel({
                sessionId: sessionId,
                name: 'userName',
                connections: [configDriverDTO.toDatabse() as IConnection]
            });
            await user.save();
            return;
        } catch (error) {
            console.log((error as Error).message );
        }
    }   
    public async addNewConnectionToUser(sessionId: number, configDriverDTO: ConnectionDriverDTO ): Promise<void> {
        console.log(`addNewConnectionToUser ${sessionId}`);
        const user = await this.userModel.findOne({ sessionId: sessionId });    
        if (!user) {
            throw new Error('User not found');
        }   
        
        user.connections.push(configDriverDTO.toDatabse() as IConnection);
        await user.save();
        return; 
    }


/*
    async saveSession(session: any) {
        try {
            await this.db.collection(this.collection).insertOne(session);
        } catch (error) {
            console.log(error);
        }
    }



    async updateSession(session: any) {
        try {
            await this.db.collection(this.collection).updateOne({ sessionId: session.sessionId }, { $set: session });
        } catch (error) {
            console.log(error);
        }
    }

    async deleteSession(sessionId: string) {
        try {
            await this.db.collection(this.collection).deleteOne({ sessionId: sessionId });
        } catch (error) {
            console.log(error);
        }
    }

    async deleteAllSessions() {
        try {
            await this.db.collection(this.collection).deleteMany({});
        } catch (error) {
            console.log(error);
        }
    }*/
}