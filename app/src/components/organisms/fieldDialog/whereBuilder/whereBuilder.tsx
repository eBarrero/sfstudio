import { useState } from 'react';
import css from '../style.module.css';
import { buildWhereCondition, type WhereDraft, type WhereKind, type WhereMode } from '../../../../core/soql/whereDraft';
import { RetroInput, RetroRangeInput } from '../../../atoms/RetroStyle/Input/RetroInput';
import ListSelection from '../../../atoms/ListSelecction/ListSelection';
import DateLiteralPicker from './dateLiteralPicker';

interface Props {
  field: GetFieldsIndex;
  path: string;
  applyNewCondition: (condition: SimpleCondition | pairCondition) => void;
  onApplied?: () => void;
}

function fieldKind(type: string): WhereKind {
  if (type === 'date' || type === 'datetime' || type === 'boolean' || type === 'picklist' || type === 'multiselectPicklist')
    return type === 'multiselectPicklist' ? 'multiselect' : type;
  if (['currency', 'double', 'percent', 'rollUpSummary'].includes(type)) return 'number';
  return 'text';
}

const comparisonOperators = ['=', '!=', '>', '<', '>=', '<='];

export default function WhereBuilder({ field, path, applyNewCondition, onApplied }: Props) {
  const kind = fieldKind(field.type);
  const [mode, setMode] = useState<WhereMode>(kind === 'picklist' || kind === 'multiselect' ? 'list' : 'single');
  const [operator, setOperator] = useState(kind === 'picklist' ? 'IN' : kind === 'multiselect' ? 'INCLUDES' : '=');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [dateLiteral, setDateLiteral] = useState('TODAY');
  const [error, setError] = useState('');
  const fieldId: FieldId = { fieldApiName: `${path}${field.fieldApiName}`, fieldIndex: field.fieldLocalId };
  const draft: WhereDraft = { field: fieldId, kind, mode, operator, from, to, values, dateLiteral };
  let preview = '';
  let draftError = '';
  try { preview = buildWhereCondition(draft).sqlString; }
  catch (cause) { draftError = (cause as Error).message; }

  const modes: { value: WhereMode; label: string }[] = kind === 'picklist' || kind === 'multiselect'
    ? [{ value: 'list', label: 'Values' }, { value: 'null', label: 'NULL' }]
    : kind === 'boolean' ? [{ value: 'single', label: 'Value' }, { value: 'null', label: 'NULL' }]
      : kind === 'date' || kind === 'datetime'
        ? [{ value: 'single', label: 'Date' }, { value: 'range', label: 'Range' },
          { value: 'literal', label: 'Relative date' }, { value: 'null', label: 'NULL' }]
        : kind === 'number' ? [{ value: 'single', label: 'Value' }, { value: 'range', label: 'Range' }, { value: 'null', label: 'NULL' }]
          : [{ value: 'single', label: 'Value' }, { value: 'range', label: 'Range' },
            { value: 'list', label: 'List' }, { value: 'null', label: 'NULL' }];
  const operators = mode === 'null' || mode === 'range' ? ['=', '!='] : mode === 'list'
    ? kind === 'multiselect' ? ['INCLUDES', 'EXCLUDES'] : ['IN', 'NOT IN']
    : kind === 'boolean' ? ['=', '!='] : kind === 'text' ? [...comparisonOperators, 'LIKE'] : comparisonOperators;
  const inputType = kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text';

  function changeMode(next: WhereMode) {
    setMode(next);
    setOperator(next === 'list' ? kind === 'multiselect' ? 'INCLUDES' : 'IN' : '=');
    setError('');
  }
  function apply() {
    try {
      applyNewCondition(buildWhereCondition(draft));
      setError('');
      onApplied?.();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  return <section className={css.wherePanel} aria-label="WHERE condition editor">
    <div className={css.panel}>
      <label>Value type <select value={mode} onChange={event => changeMode(event.target.value as WhereMode)}>
        {modes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select></label>
      {kind === 'datetime' && mode !== 'null' && mode !== 'literal' &&
        <p>Enter date and time in UTC, for example 2026-01-15T12:30:00Z.</p>}
      {mode === 'single' && kind === 'boolean' && <label>Value
        <select value={from} onChange={event => setFrom(event.target.value)}>
          <option value="">Choose a value</option><option value="true">True</option><option value="false">False</option>
        </select></label>}
      {mode === 'single' && kind !== 'boolean' && <RetroInput key={`${fieldId.fieldApiName}-single`}
        label="Value" type={inputType} onChangeValue={value => setFrom(value.from)} />}
      {mode === 'range' && <RetroRangeInput key={`${fieldId.fieldApiName}-range`}
        type={inputType} labelFrom="From" labelTo="To"
        onChangeRangeValue={value => { setFrom(value.from); setTo(value.to); }} />}
      {mode === 'literal' && <DateLiteralPicker value={dateLiteral} onChange={setDateLiteral} />}
      {mode === 'list' && (kind === 'picklist' || kind === 'multiselect') &&
        <ListSelection key={fieldId.fieldApiName}
          initialValues={field.picklistValues.map(item => ({ code: item.value, description: item.label }))}
          availableCaption="Available values" selectedCaption="Selected values"
          onSelectionChange={(selected, notIn) => {
            setValues(selected);
            setOperator(kind === 'multiselect' ? notIn ? 'EXCLUDES' : 'INCLUDES' : notIn ? 'NOT IN' : 'IN');
          }} />}
      {mode === 'list' && kind === 'text' && <label>Values, one per line
        <textarea value={values.join('\n')} onChange={event => setValues(event.target.value.split('\n'))} />
      </label>}
    </div>
    {!(mode === 'list' && (kind === 'picklist' || kind === 'multiselect')) && <div className={css.panel}>
      <label>Condition <select value={operator} onChange={event => setOperator(event.target.value)}>
        {operators.map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
    </div>}
    <section className={css.card}>
      <span className={css.cardTitle}>Predicate preview</span>
      <output className={css.sql}>{preview || 'Complete the condition to see a preview.'}</output>
      {draftError && <p aria-live="polite">{draftError}</p>}
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={!preview} onClick={apply}>Apply</button>
    </section>
  </section>;
}
