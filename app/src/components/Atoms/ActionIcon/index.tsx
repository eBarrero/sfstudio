import css from './local.module.css';


type iconName  =  "NONE" | "undo" | "back" ;




const ActionIcon = (props: {iconName: iconName, onClick?: () => void}) => {

    const {iconName, onClick} = props;
    let icon: string | undefined;
    if(iconName==='undo') { icon = '\u21bb'; } 
    else if(iconName==='back') { icon = "\u21b6" ; }
    else if(iconName!=='NONE') { icon = '.' }
    else { icon = undefined; }

    const  onCLickHandle = ()=>()=> {
        (iconName!=='NONE') && onClick && onClick!();
    }

   // (iconName!=='NONE') &&

    return (
        icon && <span className={css.circle} onClick={onCLickHandle()}>{icon}</span>
    );
}   

export default ActionIcon;



