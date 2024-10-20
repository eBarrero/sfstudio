
import { t } from '../../../utils/utils';
import applicationState from '../../../store/applicationState';
import useApplication from '../../../store/applicationHook';
import {getCommands, getMenus} from '../../../core/commandManager';
import { MiniButton } from '../../atoms/buttons/buttons';
import ContextualMenu from '../../atoms/ContextualMenu/ContextualMenu';
import { CONTEXT_LEVEL}  from "../../../core/commandManager";
import css from './style.module.css';



/**
 Component: Console 
 Goal: This component allows the user to interact to other components by typing commands, for exemple, to filter the data in the table.
*/
const Console = () => {
    const { setCommand, sendFilter, exeCommand, filter, lastError,  currentCommand, helpOnLine, history, context_level, suggestions } = useApplication();
    const { exeCommandFromUI } = applicationState();

    const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setCommand(inputValue);        
    }    



    function menuActionHandle(command: string) {
        exeCommandFromUI(command);
    }


    const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        sendFilter(inputValue);
    }

    
    return (
        <section role={"textbox"} aria-multiline={true} aria-label={"Command Console"} className={css.console} id={"console"}  >
            <div>
                <ContextualMenu menus={getMenus(context_level)} action={menuActionHandle} />            
            </div>
            <br/>
            <div className={css.toolBar} aria-label={"tool Bar"} id="toolbar"> 
                {getCommands(context_level).map((command, index) => (
                    <div key={index}>
                        <MiniButton  iconSymbol={command.iconSymbol!}  tooltip={t(command.description)}  onClick={() => exeCommandFromUI(command.command)}/>
                    </div>
                    )
                )}
            </div>

            {(context_level === CONTEXT_LEVEL.ORG || context_level === CONTEXT_LEVEL.OBJECT) &&
            <input className={css.console_input} id="filterInput" aria-label="Filter Input" placeholder="Enter filter..." list="valores"
                type="text"
                value={filter}
                onChange={handleFilter}
            />            
        }
            <input className={css.console_input} id="consoleInput" aria-label="Command Input" placeholder="Enter command..." list="valores"
                type="text"
                value={currentCommand}
                onChange={handleCommandChange}
                onKeyDown={(e) => {if (e.key === 'Enter') exeCommand(currentCommand)}}
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

