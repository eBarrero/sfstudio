import { fieldCapabilities } from '../../../core/soql/fieldEditor';
import { t } from '../../../utils/utils';
import viewState from '../../../store/viewState';
import constants from '../../constants';
import RetroCheckboxGroup from '../../atoms/RetroStyle/RadioGroup/RetroRadioGroup';

interface SelectProps {
    typeField: string;
    selectedFunctions: string[];
    doFieldAction(action: string, value: string, isAggregateFunction: boolean, makeGroupBy: boolean): void;
}

const Select = ({ typeField, selectedFunctions, doFieldAction }: SelectProps) => {
    const setMsgbox = viewState(state => state.setMsgbox);
    const options = fieldCapabilities(typeField).select;
    const showOptions = (grouped: boolean) => options
        .filter(option => grouped ? option.groupable : option.unGroupable)
        .map(option => ({ code: option.keyWord, label: option.description, help: t(option.help) }));
    const change = () => (code: string, checked: boolean) => {
        try {
            const option = options.find(item => item.keyWord === code);
            doFieldAction(checked ? constants.SELECTED : constants.UNSELECTED,
                code, /^(COUNT|COUNT_DISTINCT|SUM|AVG|MIN|MAX)\(/.test(code), option?.makeGroupBy ?? false);
        } catch (error) {
            setMsgbox('SELECT error', 'SOQL validation', (error as Error).message);
        }
    };

    if (!options.length) return <p>No SELECT expressions are available for this field type.</p>;
    return <div>
        {showOptions(false).length > 0 && <RetroCheckboxGroup label="Field expressions"
            options={showOptions(false)} currentCodes={selectedFunctions} onChange={change()} enabled />}
        {showOptions(true).length > 0 && <RetroCheckboxGroup label="Aggregate and grouped expressions"
            options={showOptions(true)} currentCodes={selectedFunctions} onChange={change()} enabled />}
    </div>;
};

export default Select;
