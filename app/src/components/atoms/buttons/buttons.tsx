import css from './style.module.css';



interface MiniButtonProps {
    iconSymbol: string;
    tooltip: string;
    onClick: () => void;
}


export const MiniButton = (props: MiniButtonProps) => {

    const {iconSymbol, tooltip, onClick} = props;
    const  onCLickHandle = ()=>()=> {
        console.log('MiniButton Clicked');
        onClick!();
    }

    return (
        <input type="button" className={css.miniButton} value={iconSymbol} title={tooltip} onClick={onCLickHandle()} />
    );
}