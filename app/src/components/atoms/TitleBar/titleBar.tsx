import css from './style.module.css';

interface TitleBarProps {
    title: string;
    onClose: () => void;
}

const TitleBar = (props:TitleBarProps) => {
    
    const {title, onClose} = props;
    return (
        <div className={css.titleBar}>
            <span>{title}</span>
            <button onClick={onClose}>&#x2573;</button>
        </div>
    );
}

export default TitleBar;