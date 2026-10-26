import React, { useState } from 'react'
import css from './style.module.css'
import sqlExecutionState from '../../../store/sqlExecutionState'
import applicationState from '../../../store/applicationState';
import { SOQL_CMD } from '../../../core/commandManager';

const ResultSheet = () => {
    const {captions, rows} = sqlExecutionState().selectResponse;
    const status = sqlExecutionState(state => state.sqlExecutionStatus);
    const [columnWidths, setColumnWidths] = useState<number[]>(Array(captions.length).fill(150)); 

    const handleMouseDown = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
        const startX = event.clientX;
        const startWidth = columnWidths[index];
    
        const handleMouseMove = (e:MouseEvent) => {
          const newWidth = startWidth + (e.clientX - startX);
          const updatedWidths = [...columnWidths];
          updatedWidths[index-1] = Math.max(newWidth, 50); // Asegura un ancho mínimo
          setColumnWidths(updatedWidths);
        };
    
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      };
      
      
    return (
        <section>
            <p role="status">{status === 'LOADING' ? 'Cargando resultados…' : status === 'PARTIAL'
                ? 'Resultados parciales' : status === 'DONE' ? 'Resultados completos'
                    : status === 'ERROR' ? 'No se pudo cargar la consulta.' : 'Sin resultados'}</p>
            <div className={css.resizable_table}>
                <table>
                    <thead>
                        <tr>
                            {captions.map((caption, index) => (
                                <th key={index} style={{ width: 150 }}>
                                    <div className={css.resizer} onMouseDown={(e) => handleMouseDown(index, e)} >&nbsp;</div>        
                                    <span className={css.header_content}>
                                        {caption.fieldName}
                                        
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows?.map((row, index) => (
                            <tr key={index}>
                                {row.col.map((cell, index) => (
                                    <td key={`${index}|${cell[0]}`} style={{ width: 150 }}>
                                        {
                                         cell && cell.split('|').map((value, index) => ( 
                                            <div key={`${index}`}>
                                                <div className={css.resizer} onMouseDown={(e) => handleMouseDown(index, e)} >&nbsp;</div>
                                                <span key={index}>&nbsp;{value && value}<br/></span>
                                            </div>))
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>    
                </table>
            </div>

            {status === 'PARTIAL' && <button type="button"
                onClick={() => applicationState.getState().exeCommandFromUI(SOQL_CMD.NEXT_PAGE.command)}>
                Cargar siguiente página
            </button>}

        </section>
    )
}

export default ResultSheet
