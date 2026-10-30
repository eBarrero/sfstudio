import modelState from '../../../store/modelState';
import css from './style.module.css';

export default function SOQLEdit() {
  const sql = modelState(state => state.sqlState.sql);

  return (
    <section className={css.container} aria-labelledby="soql-edit-title">
      <h1 id="soql-edit-title">Consulta SOQL</h1>
      <label htmlFor="soql-edit-query">SOQL actual · solo lectura</label>
      {!sql && <p>La consulta aparecerá aquí cuando se haya formado una SOQL válida.</p>}
      <textarea id="soql-edit-query" className={css.query} readOnly value={sql} />
    </section>
  );
}
