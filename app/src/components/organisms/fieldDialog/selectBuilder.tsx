import { fieldCapabilities } from '../../../core/soql/fieldEditor';
import { useState } from 'react';
import constants from '../../constants';
import RetroCheckboxGroup from '../../atoms/RetroStyle/RadioGroup/RetroRadioGroup';

interface SelectProps {
    typeField: string;
    selectedFunctions: string[];
    doFieldAction(action: string, value: string, isAggregateFunction: boolean, makeGroupBy: boolean): void;
    onApplied?: (message: string) => void;
}

const Select = ({ typeField, selectedFunctions, doFieldAction, onApplied }: SelectProps) => {
    const [error, setError] = useState('');
    const options = fieldCapabilities(typeField).select;
    const helpFor = (code: string, makeGroupBy: boolean) => {
        if (code.trim() === '%1') return makeGroupBy ? 'Include this field in GROUP BY.' : 'Select this field.';
        if (code === 'COUNT()') return 'Count matching records.';
        const functionName = code.split('(')[0];
        return makeGroupBy ? `Group results by ${functionName} of this field.` :
            `Apply ${functionName} to this field.`;
    };
    const showOptions = (grouped: boolean) => options
        .filter(option => grouped ? option.groupable : option.unGroupable)
        .map(option => ({ code: option.keyWord, label: option.description,
            help: helpFor(option.keyWord, option.makeGroupBy) }));
    const change = () => (code: string, checked: boolean) => {
        try {
            const option = options.find(item => item.keyWord === code);
            doFieldAction(checked ? constants.SELECTED : constants.UNSELECTED,
                code, /^(COUNT|COUNT_DISTINCT|SUM|AVG|MIN|MAX)\(/.test(code), option?.makeGroupBy ?? false);
            setError('');
            onApplied?.(checked ? 'SELECT expression added to the current query block.' :
                'SELECT expression removed from the current query block.');
        } catch (error) {
            setError((error as Error).message);
        }
    };

    if (!options.length) return <p>No SELECT expressions are available for this field type.</p>;
    return <div>
        {showOptions(false).length > 0 && <RetroCheckboxGroup label="Field expressions"
            options={showOptions(false)} currentCodes={selectedFunctions} onChange={change()} enabled />}
        {showOptions(true).length > 0 && <RetroCheckboxGroup label="Aggregate and grouped expressions"
            options={showOptions(true)} currentCodes={selectedFunctions} onChange={change()} enabled />}
        {error && <p role="alert">{error}</p>}
    </div>;
};

export default Select;
