import css from './style.module.css';

interface TitleBarProps {
    title: string;
    onClose: () => void;
    titleId?: string;
}

const TitleBar = (props:TitleBarProps) => {
    const {title, onClose, titleId} = props;


    return (
        <div className={css.titleBar}>
            <span id={titleId}>{title}</span>
            <button type="button" aria-label="Close dialog" onClick={onClose}>&#x2573;</button>
        </div>
    );
}

export default TitleBar;
