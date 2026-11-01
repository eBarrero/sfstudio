import { useEffect, useState } from 'react';
import { defaultWhereLogic, WhereLogicError } from '../../../core/soql/whereLogic';
import { qualifiedFieldName } from '../../../core/soql/whereOwnership';
import modelState from '../../../store/modelState';
import css from './style.module.css';

function WhereGroup({ element, index }: { element: PrimaryQuery | NestedQuery; index: number }) {
    const conditions = element.where ?? [];
    const storedLogic = element.whereLogic ?? defaultWhereLogic(conditions.length);
    const [draft, setDraft] = useState(storedLogic);
    const [error, setError] = useState('');

    useEffect(() => {
        setDraft(storedLogic);
        setError('');
    }, [storedLogic]);

    function apply(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            modelState.getState().setWhereLogic(index, draft);
            setError('');
        } catch (cause) {
            if (cause instanceof WhereLogicError) {
                setError(cause.code === 'INDEX_OUT_OF_RANGE'
                    ? `Usa índices entre C1 y C${conditions.length}.`
                    : 'Revisa los operadores y los paréntesis de la expresión.');
            } else setError('No se pudo actualizar la lógica WHERE.');
        }
    }

    return <section>
        <h3>{element.sObjectId.sObjectApiName}
            {element.type === 'SUBQUERY' && ` · ${element.relationshipName}`}
        </h3>
        <ol className={css.whereConditions}>
            {conditions.map((condition, conditionIndex) =>
                <li key={conditionIndex}><strong>C{conditionIndex + 1}</strong>{' '}
                    <code>{condition.sqlString}</code>{' '}
                    <small>({qualifiedFieldName(condition.field)})</small></li>)}
        </ol>
        <form onSubmit={apply}>
            <label htmlFor={`where-logic-${index}`}>Lógica WHERE de {element.sObjectId.sObjectApiName}</label>
            <input id={`where-logic-${index}`} value={draft}
                onChange={event => setDraft(event.target.value)} />
            <button type="submit">Aplicar lógica</button>
            {error && <p role="alert">{error}</p>}
        </form>
    </section>;
}

export default function WhereClausePanel() {
    const elements = modelState(state => state.queryState.queryElemnts);
    const withWhere = elements.flatMap((element, index) =>
        element.type !== 'RELETED' && element.where?.length ? [{ element, index }] : []);

    return <section aria-labelledby="where-clause-heading">
        <h2 id="where-clause-heading">Where Clause</h2>
        {withWhere.length === 0 && <p>No hay condiciones WHERE en la consulta.</p>}
        {withWhere.map(({element, index}) => <WhereGroup key={index} element={element} index={index} />)}
    </section>;
}
