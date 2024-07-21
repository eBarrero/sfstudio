import { useState, useEffect } from 'react';
import css from './local.module.css'


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
    }, [level]);


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

    return (
        <article className="boxContainer"> 
            <span className="titleSection"> <span>&#x21b6;</span>{title}</span>
                {currentOptions.map( (option) => (
                    <label key={option.id} className="boxOption" onClick={handleSelect(option.id)}>
                        <input type="radio" name="option" value={option.id} />
                        {option.label}
                    </label>
                ))}            
        </article>
    );
    }

export default OptionList;