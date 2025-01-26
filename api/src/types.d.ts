// types/express.d.ts

import { Session } from './session'; 
import { SfConnection } from './connection'; 

declare global {
  namespace Express {
    interface Request {
      appSession?: Session; 
      appConnection?: SfConnection;
      appSessionId?: number;
    }
  }
  

  export interface Container {
    signInCtrl: SignInController,
    requestConnectionCtrl: RequestConnectionController,
    requestedConnectionCtrl: RequestedConnectionController,
    signOutCtrl: SignOutController
    httpMetadataCtrl: HttpMetadataControllers
  }

type Base64 = string;
}








