import { useEffect, useState } from 'react';
import { defaultWhereLogic, WhereLogicError } from '../../../core/soql/whereLogic';
import modelState from '../../../store/modelState';
import css from './style.module.css';

function WhereGroup({ element, index }: { element: QueryElement; index: number }) {
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
            {element.type === 'RELETED' && ` · ${element.relatedTo}`}
        </h3>
        <ol className={css.whereConditions}>
            {conditions.map((condition, conditionIndex) =>
                <li key={conditionIndex}><strong>C{conditionIndex + 1}</strong>{' '}
                    <code>{condition.sqlString}</code></li>)}
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
        element.where?.length ? [{ element, index, conditions: element.where }] : []);

    return <section aria-labelledby="where-clause-heading">
        <h2 id="where-clause-heading">Where Clause</h2>
        {withWhere.length === 0 && <p>No hay condiciones WHERE en la consulta.</p>}
        {withWhere.map(({element, index}) => <WhereGroup key={index} element={element} index={index} />)}
    </section>;
}
