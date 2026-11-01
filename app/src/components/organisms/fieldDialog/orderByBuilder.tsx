import { useState } from 'react';
import { fieldCapabilities } from '../../../core/soql/fieldEditor';
import modelState from '../../../store/modelState';
import css from './style.module.css';

interface Props { field: GetFieldsIndex; path: string; onApplied?: () => void }

export default function OrderByBuilder({ field, path, onApplied }: Props) {
  const addOrderBy = modelState(state => state.addOrderBy);
  const [direction, setDirection] = useState<'' | 'ASC' | 'DESC'>('');
  const [nulls, setNulls] = useState<'' | 'FIRST' | 'LAST'>('');
  const [error, setError] = useState('');
  const allowed = field.sortable !== false && fieldCapabilities(field.type).order;
  function add() {
    if (!direction || !allowed) return;
    try {
      addOrderBy(field, direction, nulls || undefined);
      setError('');
      onApplied?.();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  return <section className={css.orderEditor} aria-label="ORDER BY editor">
    <p>Field: <strong>{path}{field.fieldApiName}</strong></p>
    {!allowed && <p>This field cannot be used in ORDER BY.</p>}
    {allowed && <>
      <label>Direction <select value={direction} onChange={event => setDirection(event.target.value as typeof direction)}>
        <option value="">Choose direction</option><option value="ASC">ASC</option><option value="DESC">DESC</option>
      </select></label>
      <label>Nulls <select value={nulls} onChange={event => setNulls(event.target.value as typeof nulls)}>
        <option value="">Default</option>
        <option value="FIRST">NULLS FIRST</option><option value="LAST">NULLS LAST</option>
      </select></label>
      <button type="button" disabled={!direction} onClick={add}>Add</button>
      {error && <p role="alert">{error}</p>}
    </>}
  </section>;
}
