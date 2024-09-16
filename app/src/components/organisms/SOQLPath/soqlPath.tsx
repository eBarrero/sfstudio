import css from './style.module.css'
import modelState from '../../../store/modelState'
import SmartLabel from '../../atoms/SmartLabel/smartLabel';


const SOQLPath = () => {
    const {queryState, showByqueryElemntsIndex} = modelState();

    function onActionHandler(action: string) {
        showByqueryElemntsIndex(parseInt(action));
    }
    
    return (
        <div className={css.container}>
        {queryState.queryElemnts.map((element, index) => {
            const iconType = element.type==='RELETED' ? '1to1' : '1toN';
            return (
                <SmartLabel key={index} iconType={iconType} label={`${element.sObjectId.sObjectApiName}`} active={false} action={`${index}`} onAcionHandler={onActionHandler} optionalTags={{}}/>
                
            )
            })}        
        </div>
    );
}   


export default SOQLPath;    