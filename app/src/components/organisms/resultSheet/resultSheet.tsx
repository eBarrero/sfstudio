import React, { useState } from 'react'
import css from './style.module.css'
import sqlExecutionState from '../../../store/sqlExecutionState'

const ResultSheet = () => {
    const {captions, rows} = sqlExecutionState().selectResponse;
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
                                         cell.split('|').map((value, index) => ( 
                                            <div key={`${index}`}>
                                                <div className={css.resizer} onMouseDown={(e) => handleMouseDown(index, e)} >&nbsp;</div>
                                                <span key={index}>&nbsp;{value}<br/></span>
                                            </div>))
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>    
                </table>
            </div>

        </section>
    )
}

export default ResultSheet