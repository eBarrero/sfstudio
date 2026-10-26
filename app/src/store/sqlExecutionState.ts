import { create } from 'zustand';
import { addCommand, CONTEXT_LEVEL, SOQL_CMD } from '../core/commandManager';
import Proxy from '../services/salesforceSchema/proxy';
import sessionState from './sessionState';

type QueryStatus = 'INIT' | 'LOADING' | 'PARTIAL' | 'DONE' | 'ERROR';

interface SqlExecutionState {
    sqlExecutionStatus: QueryStatus;
    targetOrgKey: string | null;
    cursor: string | null;
    records: Record<string, unknown>[];
    executeSql: (orgKey: SchemaName, query: string) => void;
    nextPage: () => void;
    cancel: () => void;
    clear: () => void;
    resetForOrg: () => void;
    initializeSqlExecution: () => void;
}

let requestVersion = 0;
let activeRequest: AbortController | null = null;

const sqlExecutionState = create<SqlExecutionState>((set, get) => ({
    sqlExecutionStatus: 'INIT',
    targetOrgKey: null,
    cursor: null,
    records: [],
    resetForOrg: () => get().clear(),
    clear: () => {
        requestVersion++;
        activeRequest?.abort();
        activeRequest = null;
        set({ sqlExecutionStatus: 'INIT', targetOrgKey: null, cursor: null, records: [] });
    },
    cancel: () => {
        if (get().sqlExecutionStatus !== 'LOADING') return;
        requestVersion++;
        activeRequest?.abort();
        activeRequest = null;
        set({ sqlExecutionStatus: get().records.length ? 'DONE' : 'INIT', cursor: null });
    },
    executeSql: (orgKey, query) => {
        const workspace = sessionState.getState().publicSession;
        if (get().sqlExecutionStatus === 'LOADING') return;
        if (workspace.activeOrgKey !== orgKey ||
            !workspace.connections.some(connection => connection.orgKey === orgKey && connection.status === 'CONNECTED'))
            throw new Error('Reautentica y selecciona el destino de la consulta.');
        const version = ++requestVersion;
        const controller = new AbortController();
        activeRequest = controller;
        set({ sqlExecutionStatus: 'LOADING', targetOrgKey: orgKey, cursor: null, records: [] });
        void Proxy.sendSoqlAdapter(orgKey, query, controller.signal).then(page => {
            if (version !== requestVersion) return;
            activeRequest = null;
            set({ records: page.records, cursor: page.cursor ?? null,
                sqlExecutionStatus: page.cursor ? 'PARTIAL' : 'DONE' });
        }).catch(() => {
            if (version !== requestVersion) return;
            activeRequest = null;
            set({ sqlExecutionStatus: 'ERROR', cursor: null });
        });
    },
    nextPage: () => {
        const { cursor, targetOrgKey, records, sqlExecutionStatus } = get();
        const workspace = sessionState.getState().publicSession;
        if (!cursor || !targetOrgKey || sqlExecutionStatus !== 'PARTIAL' ||
            workspace.activeOrgKey !== targetOrgKey) return;
        const version = ++requestVersion;
        const controller = new AbortController();
        activeRequest = controller;
        set({ sqlExecutionStatus: 'LOADING' });
        void Proxy.nextSoqlPage(targetOrgKey, cursor, controller.signal).then(page => {
            if (version !== requestVersion) return;
            activeRequest = null;
            const allRecords = [...records, ...page.records];
            set({ records: allRecords, cursor: page.cursor ?? null,
                sqlExecutionStatus: page.cursor ? 'PARTIAL' : 'DONE' });
        }).catch(() => {
            if (version !== requestVersion) return;
            activeRequest = null;
            set({ sqlExecutionStatus: 'ERROR', cursor: null });
        });
    },
    initializeSqlExecution: () => {
        addCommand({ ...SOQL_CMD.NEXT_PAGE, actionId: 'query.next', action: () => get().nextPage() });
        addCommand({ ...SOQL_CMD.CANCEL, actionId: 'query.cancel', action: () => get().cancel() });
        addCommand({ ...SOQL_CMD.CLEAR, actionId: 'query.clear', action: () => get().clear() });
        addCommand({ ...SOQL_CMD.RUN_SOQL, actionId: 'query.run',
            action: (actionParams: AcctionParams) => {
                const { model, view, application } = actionParams;
                if (!model.sqlState.isValid) throw new Error('#Error.SQL_NOT_VALID');
                const workspace = sessionState.getState().publicSession;
                const target = workspace.connections.find(connection => connection.orgKey === model.state.orgSfName &&
                    connection.status === 'CONNECTED' && connection.orgKey === workspace.activeOrgKey);
                if (!target) throw new Error('Reautentica y selecciona el destino de la consulta.');
                if (!globalThis.confirm(`Ejecutar SELECT en ${target.alias} (${target.orgKey}) con límite de 200 filas?`)) return;
                get().executeSql(model.state.orgSfName, model.sqlState.sql);
                view.setCurrentView('SQL_RESULT');
                application.setContextLevel(CONTEXT_LEVEL.SQL_EXECUTION);
            },
        });
    },
}));

export default sqlExecutionState;
