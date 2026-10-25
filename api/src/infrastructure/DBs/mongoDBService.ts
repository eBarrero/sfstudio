import mongoose, { Connection } from "mongoose";
import { logger } from "../frameworks/structuredLogger";


export class MongoDBService {
    private dbConnection: Connection;

    constructor(private mongoURL: string) {
        const clientOptions: mongoose.ConnectOptions = { serverApi: { version: "1", strict: true, deprecationErrors: true } };            
        this.mongoURL = mongoURL;
        this.dbConnection = mongoose.createConnection(this.mongoURL, clientOptions);

        this.dbConnection.on('connected', () => logger.info("mongodb.connected"));
        this.dbConnection.on('error', (error) => logger.error("mongodb.connection_error", {
            errorName: (error as Error).name,
        }));
        this.dbConnection.on('disconnected', () => logger.warn("mongodb.disconnected"));
    }

    public getConnection = ():Connection => this.dbConnection;

    public async isReady(): Promise<boolean> {
        return this.dbConnection.readyState === 1;
    }

    public async disconnect() {
        logger.info("mongodb.disconnecting");
        try {
            if (this.dbConnection.readyState!==0) {        
                await this.dbConnection.close();
                logger.info("mongodb.disconnected");
            } else {
                logger.info("mongodb.already_disconnected");
            }
        } catch (error) {
            throw new Error("Error disconnecting from MongoDB: " + (error as Error).message);
        }
    }
}

