import { MONGO_URL } from './config/environment';
import { MongoDBService }                                                                                    from './infrastructure/DBs/mongoDBService';
import { MongoDBUserRepository }                                                                             from "./sessionManager/infrastructure/output_adapter/mongoDB/mongoDBUserRepository";
import { SignInController, RequestConnectionController, RequestedConnectionController, SignOutController }   from "./sessionManager/infrastructure/input_adapter/httpControllers";     
import { SignInUseCase, RequestConnectionUseCase, RequestedConnectionUseCase, SignOutUseCase }               from "./sessionManager/application/use_cases/connectionUseCases";
import { HttpMetadataControllers }                                                                           from "./sessionManager/infrastructure/input_adapter/httpMetadataControllers";
import { MetadataRequestUseCase }                                                                            from "./sessionManager/application/use_cases/metadataUseCases";
import { OAuthStateStore }                                                                                   from "./sessionManager/domain/entities/oauthStateStore";




const db = new MongoDBService(MONGO_URL);
const mongoDBUserRepository  = new MongoDBUserRepository(db);
const signInUseCase = new SignInUseCase(mongoDBUserRepository);
const oauthStateStore = new OAuthStateStore();

const container = {
    signInCtrl: new SignInController(signInUseCase),
    requestConnectionCtrl: new RequestConnectionController(
        new RequestConnectionUseCase(),
        signInUseCase,
        oauthStateStore,
    ),
    requestedConnectionCtrl: new RequestedConnectionController(
        new RequestedConnectionUseCase(mongoDBUserRepository),
        oauthStateStore,
    ),
    signOutCtrl: new SignOutController(new SignOutUseCase()),
    httpMetadataCtrl: new HttpMetadataControllers(new MetadataRequestUseCase()),
    readinessProbe: db,
};

export type AppContainer = typeof container;

export default container;
