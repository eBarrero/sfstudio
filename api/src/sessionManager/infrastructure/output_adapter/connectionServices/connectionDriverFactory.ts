import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { ConnectionDriver } from './connectionDriver'; 
import SalesforceOAuth2 from './salesforceOAuth2';

export default class ConnectionDriverFactory {
    public static createDriver(configDriverDTO: ConnectionDriverDTO): ConnectionDriver {
               if (configDriverDTO.isSalesforce())    {   return new SalesforceOAuth2(configDriverDTO);
        } else if (configDriverDTO.isMongoDB()) {          throw new Error('MongoDB not implemented yet');
        } else if (configDriverDTO.isMySQL()) {            throw new Error('MySQL not implemented yet');
        } else if (configDriverDTO.isPostgreSQL()) {       throw new Error('PostgreSQL not implemented yet');
        } else {
            throw new Error('Driver not found');
        }
    }
}

