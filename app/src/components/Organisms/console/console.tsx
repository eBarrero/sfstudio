import  { useState } from 'react';  
import useModelState from '../../../store/modelState';
import useDataState from '../../../store/dataState';
import css from './style.module.css';
import { useTranslation } from 'react-i18next';


/**
 Component: Console 
 Goal: This component allows the user to interact to other components by typing commands, for exemple, to filter the data in the table.
*/

const Console = () => {
    const { action, orgSfName } = useModelState().state;
    const { setObjectFilterText } = useDataState()
    const [command, setCommand] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);


    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(e.target.value);
    }

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setHistory([...history, command]);
            setCommand('');
            setCurrentHistoryIndex(-1);
            setObjectFilterText(orgSfName, e.currentTarget.value);
        } else if (e.key === 'ArrowUp') {
            if (currentHistoryIndex < history.length - 1) {
                setCurrentHistoryIndex(currentHistoryIndex + 1);
                setCommand(history[currentHistoryIndex + 1]);
            }
        } else if (e.key === 'ArrowDown') {
            if (currentHistoryIndex > 0) {
                setCurrentHistoryIndex(currentHistoryIndex - 1);
                setCommand(history[currentHistoryIndex - 1]);
            }
        }
    }

    return (
        <section role={"textbox"} aria-multiline={true} aria-label={"Command Console"} className={css.console} id={"console"}  >
            <div className={css.consoleHeader} aria-label={"Console Status"} id={"consoleStatus"}> 
                <span className={css.consoleTitle}>mode: command {action}</span>
            </div>
            <input className={css.console_input} id="consoleInput" aria-label="Command Input" placeholder="Enter command..." 
                type="text"
                value={command}
                onChange={handleCommandChange}
                onKeyDown={handleCommandKeyDown}
            />
            
            <div className={css.consoleHistory} aria-label={"Console History"} id={"consoleHistory"}>
                {history.map((command, index) => (
                    <div key={index}>{command}</div>
                ))}
            </div>

        </section>
    )
}

export default Console;