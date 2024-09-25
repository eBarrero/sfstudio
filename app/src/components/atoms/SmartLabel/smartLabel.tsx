import css  from './style.module.css'
import SVGIcon from '../Icons/xsvgIcon';



interface SmartLabelProps {
    label: string
    iconType: string     
    action: string
    active: boolean
    optionalTags: {
        subLabel?: string
        tooltip?: string
    }
    onActionHandler: (action: string) => void
}

const SmartLabel: React.FC<SmartLabelProps> = ({label, iconType, action, active, optionalTags,  onActionHandler}) => {
    const {subLabel, tooltip} = optionalTags;

    const onClickHandler = () => () =>  {
        active && onActionHandler(action);
    }   

    return (   
        <div className={css.container}> 
            <button onClick={onClickHandler()}>
                <SVGIcon iconType={iconType} tooltip={tooltip} />
            </button>
            <span>{label} {subLabel}</span>     
        </div>
    )
}

export default SmartLabel;