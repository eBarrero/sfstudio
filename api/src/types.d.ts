// types/express.d.ts


import { SfConnection } from './connection'; 
import { SessionId } from './sessionManager/domain/entities/workspaceSession';

declare global {
  namespace Express {
    interface Request {
      appConnection?: SfConnection;
      appSessionId?: SessionId;
      correlationId?: string;
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








