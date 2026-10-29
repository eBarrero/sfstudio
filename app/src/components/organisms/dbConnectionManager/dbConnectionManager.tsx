import css from './style.module.css';
import sessionState, { ORG_USE_ACTION_ID, dispatchWorkspaceAction } from '../../../store/sessionState';
import applicationState from '../../../store/applicationState';
import type { ConnectionStatus } from '../../../services/session/types';

const statusLabel: Record<ConnectionStatus, string> = {
  CONNECTED: 'Conectada',
  CONNECTING: 'Conectando',
  REAUTH_REQUIRED: 'Reautenticación necesaria',
  ERROR: 'Error de conexión',
};

export function shortOrganizationId(value: string): string {
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export default function DBConnectionManager() {
  const workspace = sessionState(state => state.publicSession);
  const lastError = sessionState(state => state.lastError);
  const dispatch = (action: Parameters<typeof dispatchWorkspaceAction>[0]) =>
    dispatchWorkspaceAction(action, applicationState.getState().context_level);

  return (
    <section aria-label="Organizaciones" className={css.manager}>
      <h2>Organizaciones</h2>
      <div className={css.connectActions}>
        <button type="button" data-action-id="org.connect"
          onClick={() => { void dispatch({ id: 'org.connect', environment: 'PRODUCTION' }); }}>
          Conectar producción
        </button>
        <button type="button" data-action-id="org.connect"
          onClick={() => { void dispatch({ id: 'org.connect', environment: 'SANDBOX' }); }}>
          Conectar sandbox
        </button>
      </div>
      <ul className={css.connectionList}>
        {workspace.connections.map(connection => {
          const active = connection.orgKey === workspace.activeOrgKey;
          const shortId = shortOrganizationId(connection.organizationId);
          return (
            <li key={connection.orgKey} className={css.connectionItem}>
              <div className={css.identity}>
                <strong>{connection.alias}</strong>
                <span>{connection.environmentKind === 'PRODUCTION' ? 'Producción' : 'Sandbox'}</span>
                <span>Usuario: {connection.userName}</span>
                <span title={connection.organizationId} aria-label={`Organization ID ${connection.organizationId}`}>
                  ID: {shortId}
                </span>
                <span className={css[`status-${connection.status}`]}>
                  Estado: {statusLabel[connection.status]}
                </span>
                {active && <strong>Organización activa</strong>}
              </div>
              <div className={css.actions}>
                {connection.status === 'CONNECTED' && (
                  <>
                    <button type="button" aria-pressed={active} data-action-id={ORG_USE_ACTION_ID}
                      onClick={() => { void dispatch({ id: 'org.use', orgKey: connection.orgKey }); }}>
                      Usar {connection.alias} ({shortId})
                    </button>
                    <button type="button" data-action-id="org.close"
                      onClick={() => { void dispatch({ id: 'org.close', orgKey: connection.orgKey }); }}>
                      Desconectar
                    </button>
                  </>
                )}
                {connection.status === 'REAUTH_REQUIRED' && (
                  <button type="button" data-action-id="org.reconnect"
                    onClick={() => { void dispatch({ id: 'org.reconnect', orgKey: connection.orgKey }); }}>
                    Reautenticar
                  </button>
                )}
                {connection.status === 'ERROR' && (
                  <button type="button" data-action-id="org.reconnect"
                    onClick={() => { void dispatch({ id: 'org.reconnect', orgKey: connection.orgKey }); }}>
                    Reintentar conexión
                  </button>
                )}
                {connection.status === 'CONNECTING' && <span>Espera a que termine la conexión.</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {workspace.connections.length > 0 && (
        <button type="button" data-action-id="workspace.close"
          onClick={() => { void dispatch({ id: 'workspace.close' }); }}>Cerrar workspace</button>
      )}
      {lastError && <p role="alert">{lastError}</p>}
    </section>
  );
}
