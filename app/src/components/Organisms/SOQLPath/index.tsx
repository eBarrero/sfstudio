import css from './local.module.css'
import { useAppState } from '../../../store/AppState'
import SmartLabel from '../../Atoms/SmartLabel';


const SOQLPath = () => {
    const {queryState, showByqueryElemntsIndex} = useAppState();

    function onActionHandler(action: string) {
        showByqueryElemntsIndex(parseInt(action));
    }


    return (
        <div className={css.container}>
        {queryState.queryElemnts.map((element, index) => {
            const iconType = element.type==='RELETED' ? '1to1' : '1toN';
            return (
                <SmartLabel key={index} iconType={iconType} label={element.sObjectId.sObjectApiName} active={false} action={`${index}`} onAcionHandler={onActionHandler} optionalTags={{}}/>
                
            )
            })}        
        </div>
    );
}   


export default SOQLPath;    