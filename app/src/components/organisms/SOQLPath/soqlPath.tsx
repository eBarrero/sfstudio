/**
 * Component that renders a hierarchical path of SOQL query elements and allows choose the sObject involve in the SOQL by NODEL_#CMD.SET_QUERY command.
 * 
 * @example
 * <SOQLPath />
 * 
 *
 */
import css              from './style.module.css'
import appState         from '../../../store/applicationState'
import modelState       from '../../../store/modelState'
import { NODEL_CMD }    from '../../../core/commandManager'
import { IconCharacter} from '../../constants'
import SmartLabel       from '../../atoms/SmartLabel/smartLabel';




const SOQLPath = () => {
    const {rankQueryElements, queryState}= modelState();
    const {exeCommandFromUI} = appState();

    function handleCommandExecution(action: string) {
        exeCommandFromUI(NODEL_CMD.SET_QUERY.command + ' ' + action);
    }

    return (
        <div className={css.container}>
        {rankQueryElements && rankQueryElements.map((r, index) => {
            const [hierarchy, elementIndex] = r;
            const element = queryState.queryElemnts[elementIndex];
            const iconType = element.type==='RELETED' ? '1to1' : '1toN';
            const margin = 20 * hierarchy.length-1;
            return (
                <div key={`${index}${element.sObjectId.sObjectLocalId}`} 
                     style={{ paddingLeft : `${margin}px` }}>
                    <SmartLabel  
                                iconType={iconType} 
                                label={`${element.sObjectId.sObjectApiName}`} 
                                active={(queryState.indexCurrentElement !== elementIndex)}
                                action={`${elementIndex}`} 
                                onActionHandler={handleCommandExecution} 
                                optionalTags={{ subLabel: (queryState.indexCurrentElement === elementIndex)?IconCharacter.ARROW1:''}}/>
                </div>
            )
            })}        
        </div>
    );
}   


export default SOQLPath;    