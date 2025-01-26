
import css from './style.module.css';
import sessionState from "../../../store/sessionState";
import { IconCharacter } from "../../constants";

const DBConnectionManager = () => {
    const { publicSession } = sessionState();
  
    const getStatusClass = (connection: PublicConnectionDefinition) => {
      if (connection.isOnError) return css['status-error'];
      if (connection.isConnected) return css['status-connected'];
      return css['status-closed'];
    };
  
    return (
      <div>
        {publicSession.connections && publicSession.connections.map((c, i) => (
          <div key={i} className={css.connectionItem}>
            {/* tools */}
            <span 
                className={css.buttonLike} 
                role="button" 
                aria-label="connection tools">
                {IconCharacter.GEAR_WHEEl}
            </span>
            <span className={`${css['status-indicator']} ${getStatusClass(c)}`} />          {/* status connection */}
            {i === publicSession.currentConnection && <span>{IconCharacter.CHECK} </span>}  {/* is active? */} 
            <span>{c.alias} - {c.dbName}</span>                                              {/* Technology and database name */}
          </div>
        ))}
      </div>
    );
  };
  

export default DBConnectionManager;
