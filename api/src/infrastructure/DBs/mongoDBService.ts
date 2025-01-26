import mongoose, { Connection } from "mongoose";


export class mongoDBService {
    private dbConnection: Connection;

    constructor(private mongoURL: string) {
        const clientOptions: mongoose.ConnectOptions = { serverApi: { version: "1", strict: true, deprecationErrors: true } };            
        this.mongoURL = mongoURL;
        this.dbConnection = mongoose.createConnection(this.mongoURL, clientOptions);

        this.dbConnection.on('connected', () => console.log('Conectado a la base de datos'));
        this.dbConnection.on('error', (err) => console.error('Error en la conexión:', err));
        this.dbConnection.on('disconnected', () => console.log('Conexión cerrada'));
    }

    public getConnection = ():Connection => this.dbConnection;

    public async disconnect() {
        console.log("Disconnecting from MongoDB...");
        try {
            if (this.dbConnection.readyState!==0) {        
                await this.dbConnection.close();
                console.log("Disconnected from MongoDB!");
            } else {
                console.log("Already disconnected from MongoDB");
            }
        } catch (error) {
            throw new Error("Error disconnecting from MongoDB: " + (error as Error).message);
        }
    }
}

