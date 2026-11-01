import { useEffect, useState } from 'react';
import { SAVED_SOQL_ACTION, listSavedSoql, loadSavedSoql } from '../../../core/savedSoqlActions';
import type { SavedSoql } from '../../../services/savedSoql/savedSoqlRepository';
import sessionState from '../../../store/sessionState';

export default function SOQLManagement() {
  const orgKey = sessionState(state => state.publicSession.activeOrgKey);
  const connections = sessionState(state => state.publicSession.connections);
  const [queries, setQueries] = useState<SavedSoql[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listSavedSoql().then(items => { if (live) setQueries(items); })
      .catch(() => { if (live) setFeedback('No se pudieron leer las consultas guardadas.'); });
    return () => { live = false; };
  }, []);

  async function load(id: string) {
    setLoadingId(id);
    setFeedback('');
    try { await loadSavedSoql(id); }
    catch (error) { setFeedback(error instanceof Error ? error.message : 'No se pudo cargar la consulta.'); }
    finally { setLoadingId(null); }
  }

  function group(title: string, items: SavedSoql[]) {
    return <section aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 && <p>No hay consultas.</p>}
      <ul>{items.map(query => {
        const source = connections.find(connection => connection.orgKey === query.createdOrgKey);
        return <li key={query.id}>
          <strong>{query.name}</strong>{' · '}
          <span>Origen: {source?.alias ?? query.createdOrgKey}</span>{' · '}
          <time dateTime={query.lastModifiedDate}>{new Date(query.lastModifiedDate).toLocaleString()}</time>{' '}
          <pre>{query.body}</pre>
          <button type="button" data-action-id={SAVED_SOQL_ACTION.LOAD} disabled={loadingId !== null} onClick={() => { void load(query.id); }}>
            {loadingId === query.id ? 'Cargando…' : 'Cargar'}
          </button>
        </li>;
      })}</ul>
    </section>;
  }

  return <section aria-labelledby="soql-management-title">
    <h1 id="soql-management-title">SOQL Management</h1>
    {group('Disponibles en esta organización', queries.filter(query => orgKey && query.availableOrgKeys.includes(orgKey)))}
    {group('De otras organizaciones', queries.filter(query => !orgKey || !query.availableOrgKeys.includes(orgKey)))}
    <p role="status">{feedback}</p>
  </section>;
}
