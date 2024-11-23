// types/express.d.ts

import { Session } from './session'; 
import { SfConnection } from './connection'; 

declare global {
  namespace Express {
    interface Request {
      appSession?: Session; 
      appConnection?: SfConnection;
    }
  }
  
type Base64 = string;
}








