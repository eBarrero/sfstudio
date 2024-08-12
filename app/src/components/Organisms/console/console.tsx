import { useState, useEffect } from 'react';
import useApplication from '../../../store/ApplicationHook';
import css from './style.module.css';



/**
 Component: Console 
 Goal: This component allows the user to interact to other components by typing commands, for exemple, to filter the data in the table.
*/
const Console = () => {
    const [ history, setHistory ] = useState('');
    
    const { sessionStatus, setCommand, lastCommand, currentCommand } = useApplication();

    useEffect(() => {
        if (lastCommand !== undefined && lastCommand !== null) {
            setHistory(lastCommand+"\n" + history);
        }
    }, [lastCommand]);

    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(e.target.value);
    }    

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setCommand('ENTER');
        }
    }
    return (
        <section role={"textbox"} aria-multiline={true} aria-label={"Command Console"} className={css.console} id={"console"}  >
            <div className={css.consoleHeader} aria-label={"Console Status"} id={"consoleStatus"}> 
                <span className={css.consoleTitle}>mode: command {sessionStatus}  </span>
            </div>
            <input className={css.console_input} id="consoleInput" aria-label="Command Input" placeholder="Enter command..." 
                type="text"
                value={currentCommand}
                onChange={handleCommandChange}
                onKeyDown={handleCommandKeyDown}                
            />
            
            <div className={css.consoleHistory} aria-label={"Console History"} id={"consoleHistory"}>
                    <div>{history}</div>
            </div>

        </section>
    )    
}

export default Console;

/*
const Console = () => {
    const { setCurrentView, command, setCommand, commandState,  setComponentShowed, reSetComponentShowed } = viewState();
    const { state, setSObject } = modelState();
    const { action, orgSfName } = state;
    const { setFieldFilterText, setObjectFilterText, sobjects, loadFields } = dataState()
    const [history, setHistory] = useState<string[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  
    useEffect(() => {
        if (orgSfName === '' || command === undefined || command === '') return;
        if (command[0] !== '.') {
            if (action === 'INIT') {
            setObjectFilterText(orgSfName, command);
            } else if (action === 'sobject') {
                setFieldFilterText(orgSfName, sobjects[0].sObjectLocalId, command);
            }    
        }
    },[orgSfName,command, action]);

    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(e.target.value);
    }

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setHistory([...history, command]);
            if (commandState === 'COMMAND') {
                if (command === '.Filter') {
                    setComponentShowed('OBJECT_FILTER');
                } else {
                    reSetComponentShowed();
                }            
            } else if (commandState === 'FILTER') {
                loadFields(orgSfName, sobjects[0].sObjectLocalId);
                setSObject(sobjects[0].sObjectLocalId);
                setCurrentView('sobject');

            }
            setCommand('');
            setCurrentHistoryIndex(-1);
            
            
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

export default Console;*/