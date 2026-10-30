import css from './style.module.css';
import sessionState, { ORG_USE_ACTION_ID, dispatchWorkspaceAction } from '../../../store/sessionState';
import applicationState from '../../../store/applicationState';
import type { ConnectionStatus } from '../../../services/session/types';
import { IconCharacter } from '../../constants';
import { useEffect, useRef, useState } from 'react';

const statusLabel: Record<ConnectionStatus, string> = {
  CONNECTED: 'Conectada',
  CONNECTING: 'Conectando',
  REAUTH_REQUIRED: 'Reautenticación necesaria',
  ERROR: 'Error de conexión',
};

const statusIcon: Record<ConnectionStatus, IconCharacter> = {
  CONNECTED: IconCharacter.CONNECTED,
  CONNECTING: IconCharacter.CONNECTING,
  REAUTH_REQUIRED: IconCharacter.REAUTH_REQUIRED,
  ERROR: IconCharacter.CONNECTION_ERROR,
};

const compactStatusLabel: Record<ConnectionStatus, string> = {
  CONNECTED: 'Conectada',
  CONNECTING: 'Conectando',
  REAUTH_REQUIRED: 'Reautenticar',
  ERROR: 'Error',
};

export function shortOrganizationId(value: string): string {
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export default function DBConnectionManager() {
  const workspace = sessionState(state => state.publicSession);
  const lastError = sessionState(state => state.lastError);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const dispatch = (action: Parameters<typeof dispatchWorkspaceAction>[0]) =>
    dispatchWorkspaceAction(action, applicationState.getState().context_level);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !detailsOpen) return;
    const opener = openerRef.current;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialog.querySelector<HTMLButtonElement>('[data-close-dialog]')?.focus();
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      opener?.focus();
    };
  }, [detailsOpen]);

  return (
    <section aria-label="Organizaciones" className={css.manager}>
      <div className={css.heading}>
        <h2>Organizaciones</h2>
        <button type="button" ref={openerRef} aria-label="Gestionar organizaciones"
          aria-haspopup="dialog" onClick={() => setDetailsOpen(true)}>
          <span aria-hidden="true">{IconCharacter.GEAR_WHEEl}</span>
        </button>
      </div>
      <ul className={css.connectionList}>
        {workspace.connections.map(connection => {
          const active = connection.orgKey === workspace.activeOrgKey;
          return (
            <li key={connection.orgKey} className={css.connectionItem}>
              <div className={css.summary}>
                <strong title={connection.alias}>{connection.alias}</strong>
                <span title={connection.environmentKind === 'PRODUCTION' ? 'Producción' : 'Sandbox'}>
                  {connection.environmentKind === 'PRODUCTION' ? 'Prod' : 'Sandbox'}
                </span>
                <span className={css.status} role="img" aria-label={`Estado: ${statusLabel[connection.status]}`}>
                  <span aria-hidden="true">{statusIcon[connection.status]}</span> {compactStatusLabel[connection.status]}
                </span>
                {active && <strong>Activa</strong>}
              </div>
            </li>
          );
        })}
      </ul>
      {lastError && <p role="alert">{lastError}</p>}
      <dialog ref={dialogRef} aria-labelledby="connections-dialog-title"
        onClose={() => setDetailsOpen(false)} className={css.dialog}>
        <div className={css.dialogHeading}>
          <h2 id="connections-dialog-title">Gestionar organizaciones</h2>
          <button type="button" data-close-dialog onClick={() => setDetailsOpen(false)}>Cerrar</button>
        </div>
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
        <ul className={css.detailList}>
          {workspace.connections.map(connection => {
            const active = connection.orgKey === workspace.activeOrgKey;
            const shortId = shortOrganizationId(connection.organizationId);
            return <li key={connection.orgKey} className={css.detailItem}>
              <div className={css.identity}>
                <strong>{connection.alias}</strong>
                <span>Entorno: {connection.environmentKind === 'PRODUCTION' ? 'Producción' : 'Sandbox'}</span>
                <span>Usuario: {connection.userName}</span>
                <span>Organization ID: {connection.organizationId}</span>
                <span>Estado: {statusLabel[connection.status]}</span>
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
            </li>;
          })}
        </ul>
        {workspace.connections.length > 0 && (
          <button type="button" data-action-id="workspace.close"
            onClick={() => { void dispatch({ id: 'workspace.close' }); }}>Cerrar workspace</button>
        )}
      </dialog>
    </section>
  );
}
