import { useState, useEffect,  CSSProperties } from 'react';
import css from './style.module.css'
import ActionIcon from '../../xatoms/ActionIcon/actionIcon';

interface Options {
    id: string;
    label: string;
}

interface OptionListProps {
    options: Options[];
    title: string;
    onSelect: (id: string) => void;
    secondLevel?: {
        load2ndLevel: (id: string) => Options[];
        title: string
    }
}


const OptionList = (props:OptionListProps) => {
    const {options, title, onSelect, secondLevel} = props;
    const [level, setLevel] = useState(1);
    const [currentOptions, setCurrentOptions] = useState<Options[]>([]);
    const [currentTitle, setCurrentTitle] = useState<string>('');


    useEffect(()=>{
        if (level===1)  { 
            setCurrentOptions(options);
            setCurrentTitle(title);
        }
        
    }, [level,options,title]);

    const handleSelect = (id: string) => () => {
        console.log('OptionList: ' + id + ':' + level);
        if (secondLevel && level===1) {
            setLevel(2);
            setCurrentOptions(secondLevel.load2ndLevel(id));
            setCurrentTitle(secondLevel.title);
            
            return;
        }
        onSelect && onSelect(id);
    }

    const inputStyle = (): CSSProperties=> {  
        return  (level===1 && secondLevel)? {display: 'none'} : {display: 'visible'};
    };
        

    return (
        <article className={css.OptionList}> 
            <div className={css.header}>
                <ActionIcon onClick={()=>{ setLevel(1);}} iconName={(level===1)?'NONE':'back'}/>    
                <span className={css.title} >{currentTitle}</span>
            </div>
            <div  className={css.options}> 
                {currentOptions.map( (option) => (
                    <label key={option.id} className={css.option} onClick={handleSelect(option.id)}>
                        <input type="radio" name="option" value={option.id} style={inputStyle()}/>
                        {option.label}
                    </label>
                ))}            
            </div>  
        </article>
    );
    }

export default OptionList;