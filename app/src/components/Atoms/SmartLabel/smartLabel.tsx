import css  from './style.module.css'
import SVGIcon from '../Icons/SVGIcon';



interface SmartLabelProps {
    label: string
    iconType: string     
    action: string
    active: boolean
    optionalTags: {
        subLabel?: string
        tooltip?: string
    }
    onAcionHandler: (action: string) => void
}

const SmartLabel: React.FC<SmartLabelProps> = ({label, iconType, action, active, optionalTags,  onAcionHandler}) => {
    const {subLabel, tooltip} = optionalTags;

    const onClickHandler = () => () =>  {
        active || onAcionHandler(action);
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