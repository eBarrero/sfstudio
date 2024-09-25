import { useState } from 'react';
import { t } from '../../../utils/utils';
import applicationState from '../../../store/applicationState';
import useApplication from '../../../store/applicationHook';
import {getCommands} from '../../../core/commandManager';
import { MiniButton } from '../../atoms/buttons/buttons';
import css from './style.module.css';



/**
 Component: Console 
 Goal: This component allows the user to interact to other components by typing commands, for exemple, to filter the data in the table.
*/
const Console = () => {
    const [swKeyDown, setSwKeyDown] = useState(false);
    const { setCommand, exeCommand, lastError,  currentCommand, helpOnLine, history, context_level, suggestions } = useApplication();
    const { exeCommandFromUI } = applicationState();

    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        console.log('*****handleCommandChange', inputValue, swKeyDown);
        if (!swKeyDown) setCommand(inputValue==='' ? null : inputValue);        
    }    

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        let inputValue = e.currentTarget.value;
        console.log('####handleCommandKeyDown', e.key, inputValue, swKeyDown);
        if (e.key === 'Enter' && inputValue !== '') {
            setSwKeyDown(true);
            console.log('handleCommandKeyDown', e.key, inputValue);
            exeCommand(inputValue);
            return
        }
        if (e.key === 'Backspace' && inputValue !== '' ) {
            setSwKeyDown(true);
            setCommand('.' + e.key); 
            return;
        }

        if (e.key.length==1) {
            setSwKeyDown(true);
            inputValue = inputValue + e.key;
            setCommand(inputValue==='' ? null : inputValue);  
            return;      
        }
        setSwKeyDown(false);
    }
    
    return (
        <section role={"textbox"} aria-multiline={true} aria-label={"Command Console"} className={css.console} id={"console"}  >
            <div className={css.toolBar} aria-label={"tool Bar"} id="toolbar"> 
                {getCommands(context_level).map((command, index) => (
                    <div key={index}>
                        <MiniButton  iconSymbol={command.iconSymbol!}  tooltip={t(command.description)}  onClick={() => exeCommandFromUI(command.command)}/>
                    </div>
                    )
                )}
            </div>
            <input className={css.console_input} id="consoleInput" aria-label="Command Input" placeholder="Enter command..." list="valores"
                type="text"
                value={currentCommand}
                onChange={handleCommandChange}
                onKeyDown={handleCommandKeyDown}      
                       
            />
            
            <datalist id="valores">
                {suggestions.map((suggestion, index) => { if (index < 10) return <option key={index} value={suggestion} />})}
            </datalist>
            
            <div className={css.warningOrError}>{lastError}</div>
            <div className={css.commendOrHelp}>{helpOnLine}</div>
            <textarea rows={5}  defaultValue={history} className={css.consoleHistory}  aria-multiline={true} aria-label={"Console History"} id={"consoleHistory"}/>
        </section>
    )    
}

export default Console;

