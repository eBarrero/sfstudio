
import css from './style.module.css';
import sessionState from "../../../store/sessionState";
import { IconCharacter } from "../../constants";
import type { PublicConnectionDefinition } from '../../../services/session/types';

const DBConnectionManager = () => {
    const { publicSession, lastError, loginOrganization, disconnectOrg, closeWorkspace } = sessionState();
  
    const getStatusClass = (connection: PublicConnectionDefinition) => {
      if (connection.status === 'ERROR') return css['status-error'];
      if (connection.status === 'CONNECTED') return css['status-connected'];
      return css['status-closed'];
    };
  
    return (
      <div>
        {publicSession.connections && publicSession.connections.map((c) => (
          <div key={c.orgKey} className={css.connectionItem}>
            <span className={`${css['status-indicator']} ${getStatusClass(c)}`} />          {/* status connection */}
            {c.orgKey === publicSession.activeOrgKey && <span>{IconCharacter.CHECK} </span>}
            <span>{c.alias} - {c.organizationId} - {c.userName} - {c.environmentKind} - {c.status}</span>
            {c.status === 'CONNECTED' ? (
              <button className={css.buttonLike} onClick={() => { void disconnectOrg(c.orgKey); }}>
                Desconectar
              </button>
            ) : (
              <button className={css.buttonLike} onClick={() => loginOrganization(c.orgKey)}>
                Reautenticar
              </button>
            )}
          </div>
        ))}
        {publicSession.connections.length > 0 && (
          <button className={css.buttonLike} onClick={() => { void closeWorkspace(); }}>
            Cerrar workspace
          </button>
        )}
        {lastError && <p role="alert">{lastError}</p>}
      </div>
    );
  };
  

export default DBConnectionManager;
