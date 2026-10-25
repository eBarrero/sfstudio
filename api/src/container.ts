import { MONGO_URL } from './config/environment';
import { MongoDBService }                                                                                    from './infrastructure/DBs/mongoDBService';
import { MongoDBUserRepository }                                                                             from "./sessionManager/infrastructure/output_adapter/mongoDB/mongoDBUserRepository";
import { SignInController, RequestConnectionController, RequestedConnectionController, SignOutController }   from "./sessionManager/infrastructure/input_adapter/httpControllers";     
import { SignInUseCase, RequestConnectionUseCase, RequestedConnectionUseCase, SignOutUseCase }               from "./sessionManager/application/use_cases/connectionUseCases";
import { HttpMetadataControllers }                                                                           from "./sessionManager/infrastructure/input_adapter/httpMetadataControllers";
import { MetadataRequestUseCase }                                                                            from "./sessionManager/application/use_cases/metadataUseCases";
import { OAuthStateStore }                                                                                   from "./sessionManager/domain/entities/oauthStateStore";
import { Sessions } from './sessionManager/domain/entities/sessions';
import { ConnectionRegistry } from './sessionManager/infrastructure/output_adapter/connectionServices/connectionRegistry';
import ConnectionDriverFactory from './sessionManager/infrastructure/output_adapter/connectionServices/connectionDriverFactory';




const db = new MongoDBService(MONGO_URL);
const mongoDBUserRepository  = new MongoDBUserRepository(db);
const connectionRegistry = new ConnectionRegistry();
const createDriver = ConnectionDriverFactory.createDriver;
const sessions = new Sessions(id => connectionRegistry.deleteSession(id));
const cleanupTimer = setInterval(() => {
    sessions.sweepExpired();
    connectionRegistry.sweepExpired();
}, 60_000);
cleanupTimer.unref();
const signInUseCase = new SignInUseCase(mongoDBUserRepository, sessions, connectionRegistry);
const oauthStateStore = new OAuthStateStore();

const container = {
    signInCtrl: new SignInController(signInUseCase),
    requestConnectionCtrl: new RequestConnectionController(
        new RequestConnectionUseCase(sessions, createDriver),
        signInUseCase,
        oauthStateStore,
    ),
    requestedConnectionCtrl: new RequestedConnectionController(
        new RequestedConnectionUseCase(mongoDBUserRepository, sessions, connectionRegistry, createDriver),
        oauthStateStore,
    ),
    signOutCtrl: new SignOutController(new SignOutUseCase(sessions, connectionRegistry)),
    httpMetadataCtrl: new HttpMetadataControllers(new MetadataRequestUseCase(sessions, connectionRegistry)),
    readinessProbe: db,
};

export type AppContainer = typeof container;

export default container;
