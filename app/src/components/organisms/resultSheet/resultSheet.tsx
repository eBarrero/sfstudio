import { useMemo } from 'react';
import css from './style.module.css';
import sqlExecutionState from '../../../store/sqlExecutionState';
import applicationState from '../../../store/applicationState';
import { SOQL_CMD } from '../../../core/commandManager';
import { formatQueryCell, queryTable } from '../../../core/queryTable';

const ResultSheet = () => {
    const records = sqlExecutionState(state => state.records);
    const status = sqlExecutionState(state => state.sqlExecutionStatus);
    const table = useMemo(() => queryTable(records), [records]);
    const runAction = (command: string) => applicationState.getState().exeCommandFromUI(command);

    return (
        <section>
            <p role="status">{status === 'LOADING' ? 'Cargando resultados…' : status === 'PARTIAL'
                ? 'Resultados parciales' : status === 'DONE' ? 'Resultados completos'
                    : status === 'ERROR' ? 'No se pudo cargar la consulta.' : 'Sin resultados'}</p>
            <div className={css.resizable_table}>
                <table>
                    <thead>
                        <tr>{table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, columnIndex) => <td key={table.columns[columnIndex]}>
                                    {Array.isArray(cell)
                                        ? cell.map((value, index) => <div key={index}>{value}</div>)
                                        : formatQueryCell(cell)}
                                </td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {status === 'PARTIAL' && <button type="button" data-action-id="query.next"
                onClick={() => runAction(SOQL_CMD.NEXT_PAGE.command)}>Cargar siguiente página</button>}
            {status === 'LOADING' && <button type="button" data-action-id="query.cancel"
                onClick={() => runAction(SOQL_CMD.CANCEL.command)}>Cancelar</button>}
            <button type="button" data-action-id="query.clear"
                onClick={() => runAction(SOQL_CMD.CLEAR.command)}>Limpiar resultados</button>
        </section>
    );
};

export default ResultSheet;
