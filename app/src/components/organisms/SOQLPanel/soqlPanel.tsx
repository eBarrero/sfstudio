import css from './style.module.css'
import modelState  from '../../../store/modelState'
import sessionState from '../../../store/sessionState';
import applicationState from '../../../store/applicationState';
import { SOQL_CMD } from '../../../core/commandManager';



export default function SOQLPanel() {
    const {sql} = modelState((state) => state.sqlState);
    const workspace = sessionState(state => state.publicSession);
    const target = workspace.connections.find(connection => connection.orgKey === workspace.activeOrgKey && connection.status === 'CONNECTED');
    
    return (
        <div className={css.container}>
            <p>Destino: {target ? `${target.alias} · ${target.orgKey}` : 'sin organización conectada'}</p>
            <p>Límite de ejecución: 200 filas</p>
            <pre>{sql}</pre>
            <button type="button" disabled={!target || !sql}
                onClick={() => applicationState.getState().exeCommandFromUI(SOQL_CMD.RUN_SOQL.command)}>
                Ejecutar en {target?.alias ?? 'organización'}
            </button>
        </div>
    )

}
