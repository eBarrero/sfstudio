import css from './local.module.css'

interface TitleProps {
    value: string;
}

export const Title =(props:TitleProps) => {
    return (
        <div className='{css.title}'> 
            <span>{props.value}</span>
        </div>
        
    );
}


export const TitleSection =(props:TitleProps) => {
    return (
        <div className="{css.titleSection}">
            <span>{props.value}</span>
        </div>
    );
}