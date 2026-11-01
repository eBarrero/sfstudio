import { CONTEXT_LEVEL } from './commandManager';
import { cancelObjectOpen } from './explorerActions';
import { savedSoqlRepository, type SavedSoql } from '../services/savedSoql/savedSoqlRepository';
import { restoreQuery } from '../services/savedSoql/restoreQuery';
import Proxy from '../services/salesforceSchema/proxy';
import applicationState from '../store/applicationState';
import dataState from '../store/dataState';
import modelState from '../store/modelState';
import objectPanelState from '../store/objectPanelState';
import savedSoqlState from '../store/savedSoqlState';
import sessionState from '../store/sessionState';
import viewState from '../store/viewState';

export const SAVED_SOQL_ACTION = { OPEN: 'query.management', SAVE: 'query.save', LOAD: 'query.load' } as const;

function activeOrgKey(): string {
  const workspace = sessionState.getState().publicSession;
  const key = workspace.activeOrgKey;
  if (!key || !workspace.connections.some(connection => connection.orgKey === key && connection.status === 'CONNECTED')) {
    throw new Error('Selecciona una organización conectada.');
  }
  return key;
}

export async function listSavedSoql(): Promise<SavedSoql[]> {
  return savedSoqlRepository.list();
}

export async function saveCurrentSoql(name: string): Promise<SavedSoql> {
  const orgKey = activeOrgKey();
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 100) throw new Error('El nombre debe tener entre 1 y 100 caracteres.');
  const model = modelState.getState();
  if (!model.sqlState.isValid || !model.sqlState.sql || model.state.orgSfName !== orgKey) {
    throw new Error('La consulta SOQL actual no es válida.');
  }
  const currentId = savedSoqlState.getState().currentId;
  const previous = currentId ? await savedSoqlRepository.get(currentId) : null;
  if (currentId && !previous) throw new Error('La consulta guardada ya no existe.');
  const now = new Date().toISOString();
  const query: SavedSoql = {
    id: previous?.id ?? crypto.randomUUID(),
    name: cleanName,
    createdDate: previous?.createdDate ?? now,
    lastModifiedDate: now,
    body: model.sqlState.sql,
    createdOrgKey: previous?.createdOrgKey ?? orgKey,
    availableOrgKeys: [...new Set([...(previous?.availableOrgKeys ?? []), orgKey])],
    formatVersion: 4,
    queryState: structuredClone(model.queryState),
  };
  await savedSoqlRepository.put(query);
  savedSoqlState.getState().setCurrent(query.id, query.name);
  return query;
}

export async function loadSavedSoql(id: string): Promise<void> {
  const orgKey = activeOrgKey();
  const saved = await savedSoqlRepository.get(id);
  if (!saved) throw new Error('La consulta guardada ya no existe.');
  // Ensure the global schema and every referenced object are available before changing UI state.
  await Proxy.getSObjectsAdapter(orgKey, dataState.getState().sObjectsFilter);
  const queryState = await restoreQuery(saved.queryState, orgKey);
  const root = queryState.queryElemnts[0];
  const fields = await Proxy.getFieldsAdapter(orgKey, root.sObjectId.sObjectLocalId, null);
  if (sessionState.getState().publicSession.activeOrgKey !== orgKey) return;
  const imported = !saved.availableOrgKeys.includes(orgKey);
  if (imported) await savedSoqlRepository.put({ ...saved,
    availableOrgKeys: [...saved.availableOrgKeys, orgKey] });
  if (sessionState.getState().publicSession.activeOrgKey !== orgKey) return;
  cancelObjectOpen();
  modelState.getState().loadSavedQuery(queryState);
  savedSoqlState.getState().setCurrent(saved.id, saved.name);
  dataState.setState({ sObjectFields: structuredClone(fields), dataLastErrorMessage: '' });
  dataState.getState().createFieldsCommands(fields);
  dataState.getState().createLookuoCommands(fields);
  dataState.getState().loadChildRelationships(orgKey, root.sObjectId.sObjectLocalId);
  objectPanelState.getState().resetTab();
  applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  viewState.getState().setCurrentView('sobject');
}
