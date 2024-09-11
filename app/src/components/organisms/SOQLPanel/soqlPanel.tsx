import css from './style.module.css'
import {IconCharacter} from '../../constants'
import modelState  from '../../../store/modelState'
import { MiniButton } from '../../atoms/buttons/buttons';
import { SOQL_CMD } from '../../../core/commandManager'
import applicationState from '../../../store/applicationState'




export default function SOQLPanel() {
    const {sql} = modelState((state) => state.sqlState);
    const { exeCommandFromUI } = applicationState();

    const executeSOQL = ()   => {
        console.log('Execute SOQL', SOQL_CMD.RUN_SOQL.command);
        exeCommandFromUI(SOQL_CMD.RUN_SOQL.command);  }
    
    return (
        <div className={css.container}>
            <MiniButton iconSymbol={IconCharacter.EXE} tooltip='Execute This SOQL' onClick={executeSOQL} />
            {sql}
        </div>
    )

}