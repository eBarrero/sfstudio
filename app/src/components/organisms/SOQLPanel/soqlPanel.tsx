import css from './style.module.css'
import modelState  from '../../../store/modelState'
import sessionState from '../../../store/sessionState';
import applicationState from '../../../store/applicationState';
import { SOQL_CMD } from '../../../core/commandManager';



export default function SOQLPanel() {
    const {sql, isValid} = modelState((state) => state.sqlState);
    const queryOrgKey = modelState(state => state.state.orgSfName);
    const root = modelState(state => state.queryState.queryElemnts[0]);
    const limit = root?.type === 'ROOT' ? root.limit ?? 2000 : 200;
    const workspace = sessionState(state => state.publicSession);
    const target = workspace.connections.find(connection => connection.orgKey === queryOrgKey &&
        connection.orgKey === workspace.activeOrgKey && connection.status === 'CONNECTED');
    
    return (
        <div className={css.container}>
            <p>Destino: {target ? `${target.alias} · ${target.orgKey}` : 'sin organización conectada'}</p>
            <p>Límite de ejecución: {limit} filas</p>
            <pre>{sql}</pre>
            <button type="button" data-action-id="query.run" disabled={!target || !isValid || !sql}
                onClick={() => applicationState.getState().exeCommandFromUI(SOQL_CMD.RUN_SOQL.command)}>
                Ejecutar en {target?.alias ?? 'organización'}
            </button>
        </div>
    )

}
