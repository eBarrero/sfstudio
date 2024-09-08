import useApplication from '../../../store/applicationHook';
import css from './style.module.css';



/**
 Component: Console 
 Goal: This component allows the user to interact to other components by typing commands, for exemple, to filter the data in the table.
*/
const Console = () => {
    const { setCommand, exeCommand, lastError,  currentCommand, helpOnLine, history, context_level, suggestions } = useApplication();


    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        console.log('handleCommandChange', inputValue);
        //setCommand(inputValue==='' ? null : inputValue);        
    }    

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        let inputValue = e.currentTarget.value;
        console.log('handleCommandKeyDown', e.key, inputValue);
        if (e.key === 'Enter' && inputValue !== '') {
            console.log('handleCommandKeyDown', e.key, inputValue);
            exeCommand(inputValue);
            return
        }
        if (e.key === 'Backspace' && inputValue !== '' ) {
            setCommand((inputValue[0]==='.') ? null : inputValue.slice(0, inputValue.length-1));        
            return;
        }

        if (e.key.length==1) {
            inputValue = inputValue + e.key;
            setCommand(inputValue==='' ? null : inputValue);        
        }
    }
    
    return (
        <section role={"textbox"} aria-multiline={true} aria-label={"Command Console"} className={css.console} id={"console"}  >
            <div className={css.consoleHeader} aria-label={"Console Status"} id={"consoleStatus"}> 
                <span className={css.consoleTitle}>mode: command {context_level}  </span>
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

