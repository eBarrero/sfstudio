
import css from './style.module.css';
import sessionState from "../../../store/sessionState";
import { IconCharacter } from "../../constants";
import type { PublicConnectionDefinition } from '../../../services/session/types';

const DBConnectionManager = () => {
    const { publicSession } = sessionState();
  
    const getStatusClass = (connection: PublicConnectionDefinition) => {
      if (connection.status === 'ERROR') return css['status-error'];
      if (connection.status === 'CONNECTED') return css['status-connected'];
      return css['status-closed'];
    };
  
    return (
      <div>
        {publicSession.connections && publicSession.connections.map((c) => (
          <div key={c.orgKey} className={css.connectionItem}>
            {/* tools */}
            <span 
                className={css.buttonLike} 
                role="button" 
                aria-label="connection tools">
                {IconCharacter.GEAR_WHEEl}
            </span>
            <span className={`${css['status-indicator']} ${getStatusClass(c)}`} />          {/* status connection */}
            {c.orgKey === publicSession.activeOrgKey && <span>{IconCharacter.CHECK} </span>}
            <span>{c.alias} - {c.organizationId} - {c.userName} - {c.environmentKind} - {c.status}</span>
          </div>
        ))}
      </div>
    );
  };
  

export default DBConnectionManager;
