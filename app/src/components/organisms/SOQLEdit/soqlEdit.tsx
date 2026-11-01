import { useEffect, useState } from 'react';
import { SAVED_SOQL_ACTION, saveCurrentSoql } from '../../../core/savedSoqlActions';
import modelState from '../../../store/modelState';
import savedSoqlState from '../../../store/savedSoqlState';
import css from './style.module.css';

export default function SOQLEdit() {
  const sql = modelState(state => state.sqlState.sql);
  const valid = modelState(state => state.sqlState.isValid);
  const savedName = savedSoqlState(state => state.currentName);
  const [name, setName] = useState(savedName);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(savedName), [savedName]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await saveCurrentSoql(name);
      setFeedback('Consulta guardada.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo guardar la consulta.');
    } finally { setSaving(false); }
  }

  return (
    <section className={css.container} aria-labelledby="soql-edit-title">
      <h1 id="soql-edit-title">Consulta SOQL</h1>
      <label htmlFor="soql-edit-query">SOQL actual · solo lectura</label>
      {!sql && <p>La consulta aparecerá aquí cuando se haya formado una SOQL válida.</p>}
      <textarea id="soql-edit-query" className={css.query} readOnly value={sql} />
      <form onSubmit={event => { void save(event); }}>
        <label htmlFor="soql-save-name">Nombre de la consulta</label>
        <input id="soql-save-name" value={name} maxLength={100} required
          onChange={event => setName(event.target.value)} />
        <button type="submit" data-action-id={SAVED_SOQL_ACTION.SAVE} disabled={!valid || saving}>Guardar SOQL</button>
      </form>
      <p role="status">{feedback}</p>
    </section>
  );
}
