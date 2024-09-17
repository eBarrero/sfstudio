import css from './style.module.css'
import applicationState from '../../../store/applicationState'
import {t} from '../../../utils/utils'
import viewState from '../../../store/viewState'
import {getAllCommands} from '../../../core/commandManager'
import TitleBar   from '../../atoms/TitleBar/titleBar'
import { MiniButton } from '../../atoms/buttons/buttons';

const Help = () => {
    const { context_level, exeCommandFromUI } = applicationState();
    const popDialog = viewState().popDialog
    const commandsList = getAllCommands(context_level);       

    return (
        <section className={css.container}>
            
        <div className={css.win}>
            <TitleBar title={'Help'}  onClose={popDialog} />
            <div className={css.winInner}>
            
                <div className={css.panel}>
                    {commandsList.map((command, index) => (
                        <div className={css.row} key={index}>
                            <MiniButton  iconSymbol={command.iconSymbol!}  tooltip={command.description}  onClick={() => { popDialog();  exeCommandFromUI(command.command)}}/>
                            <div className={css.command}><span className={css.label}>{command.command}</span></div>
                            <div className={css.description}>{t(command.description)}</div>
                        </div>
                    ))}
                </div>    
            </div>
        </div>
        </section>
    );
}

export default Help;