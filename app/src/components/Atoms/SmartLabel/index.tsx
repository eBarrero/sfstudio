import css  from './local.module.css'
import SVGIcon from '../Icons';



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
            <div onClick={onClickHandler()}>
                <SVGIcon iconType={iconType} tooltip={tooltip} />
            </div>
            <span>{label} {subLabel}</span>     
        </div>
    )
}

export default SmartLabel;