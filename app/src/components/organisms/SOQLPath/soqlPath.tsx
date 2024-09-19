import css from './style.module.css'
import application from '../../../store/applicationState'
import modelState from '../../../store/modelState'
import { NODEL_CMD } from '../../../core/commandManager'
import SmartLabel from '../../atoms/SmartLabel/smartLabel';


const SOQLPath = () => {
    const {queryState} = modelState();
    const {exeCommandFromUI } = application();
    function onActionHandler(action: string) {
        exeCommandFromUI(NODEL_CMD.SET_QUERY.command + ' ' + action);
    }
    console.log('queryState', queryState);
    function ranking(index: number): string {
        let solution = '';
        if (index===0) return '';
        const parent = queryState.queryElemnts[index].parent;
        
        
        solution += ranking(parent) + parent ; 
        return solution;
    }

    const ranked: [string, QueryElement, number][] =  queryState.queryElemnts
              .map((element, index): [string, QueryElement, number] => [ranking(index)+index.toString(), element, index])
              .sort((a, b) => a[0].localeCompare(b[0]));


    return (
        <div className={css.container}>
        {ranked.map((r, index) => {
            const element = r[1];
            const iconType = element.type==='RELETED' ? '1to1' : '1toN';
            const margin = 10 * r[0].length;
            return (
                <div style={{ paddingLeft : `${margin}pt` }}>
                    <SmartLabel key={`${index}${r[1].sObjectId.sObjectLocalId}`} 
                                iconType={iconType} 
                                label={`${element.sObjectId.sObjectApiName}`} 
                                active={false} action={`${r[2]}`} 
                                onAcionHandler={onActionHandler} optionalTags={{}}/>
                </div>
            )
            })}        
        </div>
    );
}   


export default SOQLPath;    