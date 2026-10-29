import { CONTEXT_LEVEL } from './commandManager';
import Proxy from '../services/salesforceSchema/proxy';
import dataState from '../store/dataState';
import modelState from '../store/modelState';
import sessionState from '../store/sessionState';
import viewState from '../store/viewState';
import applicationState from '../store/applicationState';

export const OBJECT_OPEN_ACTION_ID = 'object.open' as const;
export interface ObjectOpenAction { id: typeof OBJECT_OPEN_ACTION_ID; objectName: string; }
let openRequestVersion = 0;

export function parseExplorerCommand(input: string): ObjectOpenAction | null {
  const match = /^object\s+open\s+([a-zA-Z][a-zA-Z0-9_]*)(?:\s*)$/i.exec(input.trim());
  return match ? { id: OBJECT_OPEN_ACTION_ID, objectName: match[1] } : null;
}

export async function dispatchExplorerAction(action: ObjectOpenAction): Promise<boolean> {
  const workspace = sessionState.getState().publicSession;
  const orgKey = workspace.activeOrgKey;
  if (!orgKey || !workspace.connections.some(connection =>
    connection.orgKey === orgKey && connection.status === 'CONNECTED')) return false;
  const version = ++openRequestVersion;
  let objectId: number | null;
  try { objectId = Proxy.getSobjectIdByName(orgKey, action.objectName); }
  catch { return false; }
  if (objectId === null) return false;
  let fields: GetFieldsIndex[];
  try { fields = await Proxy.getFieldsAdapter(orgKey, objectId, null); }
  catch { return false; }
  if (version !== openRequestVersion ||
      sessionState.getState().publicSession.activeOrgKey !== orgKey) return false;
  dataState.setState({ sObjectFields: structuredClone(fields), fieldsFilter: {
    ...dataState.getState().fieldsFilter, searchText: null,
  }, dataLastErrorMessage: '' });
  dataState.getState().createLookuoCommands(fields);
  dataState.getState().createFieldsCommands(fields);
  modelState.getState().setSObject(objectId);
  dataState.getState().loadChildRelationships(orgKey, objectId);
  applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  viewState.getState().setCurrentView('sobject');
  return true;
}

export function cancelObjectOpen(): void { openRequestVersion += 1; }
