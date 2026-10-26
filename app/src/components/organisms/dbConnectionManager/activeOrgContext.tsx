import sessionState from '../../../store/sessionState';
import { shortOrganizationId } from './dbConnectionManager';
import css from './style.module.css';

export default function ActiveOrgContext() {
  const workspace = sessionState(state => state.publicSession);
  const active = workspace.connections.find(connection => connection.orgKey === workspace.activeOrgKey);
  return (
    <p className={css.activeContext} role="status" aria-live="polite">
      {active ? (
        <>
          Destino de exploración y consulta: <strong>{active.alias}</strong> ·{' '}
          {active.environmentKind === 'PRODUCTION' ? 'Producción' : 'Sandbox'} ·{' '}
          {active.userName} · <span title={active.organizationId}
            aria-label={`Organization ID ${active.organizationId}`}>
            ID {shortOrganizationId(active.organizationId)}
          </span>
        </>
      ) : 'Sin organización activa para explorar o consultar.'}
    </p>
  );
}
