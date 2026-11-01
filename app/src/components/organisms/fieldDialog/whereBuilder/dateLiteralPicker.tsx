import { useState } from 'react';
import { dateLiterals, datePeriods, type DatePeriod } from '../../../../core/soql/dateLiterals';
import css from '../style.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function DateLiteralPicker({ value, onChange }: Props) {
  const [code, count] = value.split(':');
  const current = dateLiterals.find(item => item.code === code) ?? dateLiterals[0];
  const [period, setPeriod] = useState<DatePeriod>(current.period);
  const options = dateLiterals.filter(item => item.period === period);

  function changePeriod(next: DatePeriod) {
    setPeriod(next);
    onChange(dateLiterals.find(item => item.period === next)!.code);
  }

  return <div className={css.dateLiteralPicker}>
    <div className={css.datePeriods} role="group" aria-label="Date period">
      {datePeriods.map(item => <button key={item} type="button" aria-pressed={period === item}
        onClick={() => changePeriod(item)}>{item}</button>)}
    </div>
    <label>Relative date
      <select value={current.code} onChange={event => {
        const selected = dateLiterals.find(item => item.code === event.target.value)!;
        onChange(selected.count ? `${selected.code}:1` : selected.code);
      }}>
        {options.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}
      </select>
    </label>
    {current.count && <label>Number of periods
      <input type="number" min="1" max="999" step="1" value={count ?? ''}
        onChange={event => onChange(`${current.code}:${event.target.value}`)} />
    </label>}
    <p className={css.dateHelp}>{current.description.replace('N', count || 'N')}</p>
    {period.startsWith('Fiscal') && <p className={css.dateHelp}>Fiscal periods follow the connected organization&apos;s fiscal calendar.</p>}
  </div>;
}
