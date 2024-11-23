// types/express.d.ts

import { Session } from './session'; 
import { Connection } from './connection'; 

declare global {
  namespace Express {
    interface Request {
      appSession?: Session; 
      appConnection?: Connection;
    }
  }
  
type Base64 = string;
}








