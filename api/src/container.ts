import { MONGO_URL } from './config/environment';
import { mongoDBService }                                                                                    from './infrastructure/DBs/mongoDBService';
import { MongoDBUserRepository }                                                                             from "./sessionManager/infrastructure/output_adapter/mongoDB/mongoDBUserRepository";
import { SignInController, RequestConnectionController, RequestedConnectionController, SignOutController }   from "./sessionManager/infrastructure/input_adapter/httpControllers";     
import { SignInUseCase, RequestConnectionUseCase, RequestedConnectionUseCase, SignOutUseCase }               from "./sessionManager/application/use_cases/connectionUseCases";
import { HttpMetadataControllers }                                                                           from "./sessionManager/infrastructure/input_adapter/httpMetadataControllers";
import { MetadataRequestUseCase }                                                                            from "./sessionManager/application/use_cases/metadataUseCases";




const db =  new mongoDBService(MONGO_URL);
const mongoDBUserRepository  = new MongoDBUserRepository(db);

const container = {
    signInCtrl: new SignInController(new SignInUseCase(mongoDBUserRepository)),
    requestConnectionCtrl: new RequestConnectionController(new RequestConnectionUseCase(mongoDBUserRepository)),
    requestedConnectionCtrl: new RequestedConnectionController(new RequestedConnectionUseCase(mongoDBUserRepository)),
    signOutCtrl: new SignOutController(new SignOutUseCase(mongoDBUserRepository)),
    httpMetadataCtrl: new HttpMetadataControllers( new MetadataRequestUseCase())
};


export default container;