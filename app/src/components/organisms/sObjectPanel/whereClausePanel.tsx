import { useEffect, useState } from 'react';
import { defaultWhereLogic, parseWhereLogic, WhereLogicError } from '../../../core/soql/whereLogic';
import { qualifiedFieldName } from '../../../core/soql/whereOwnership';
import { legacyConditionPreview } from '../../../core/soql/legacyAdapter';
import modelState from '../../../store/modelState';
import css from './style.module.css';

function WhereGroup({ element, index }: { element: PrimaryQuery | NestedQuery; index: number }) {
    const conditions = element.where ?? [];
    const storedLogic = element.whereLogic ?? defaultWhereLogic(conditions.length);
    const [draft, setDraft] = useState(storedLogic);
    const [error, setError] = useState('');
    let draftError = '';
    try { parseWhereLogic(draft, conditions.length); }
    catch (cause) {
        draftError = cause instanceof WhereLogicError && cause.code === 'INDEX_OUT_OF_RANGE'
            ? `Use condition numbers from C1 to C${conditions.length}.`
            : 'Check the operators and parentheses in the expression.';
    }

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
                    ? `Use condition numbers from C1 to C${conditions.length}.`
                    : 'Check the operators and parentheses in the expression.');
            } else setError('Could not update the WHERE logic.');
        }
    }

    return <section>
        <h3>{element.sObjectId.sObjectApiName}
            {element.type === 'SUBQUERY' && ` · ${element.relationshipName}`}
        </h3>
        <ol className={css.whereConditions}>
            {conditions.map((condition, conditionIndex) =>
                <li key={conditionIndex}><strong>C{conditionIndex + 1}</strong>{' '}
                    <code>{legacyConditionPreview(condition)}</code>{' '}
                    <small>({qualifiedFieldName(condition.field)})</small></li>)}
        </ol>
        <form onSubmit={apply}>
            <label htmlFor={`where-logic-${index}`}>WHERE logic for {element.sObjectId.sObjectApiName}</label>
            <input id={`where-logic-${index}`} value={draft}
                onChange={event => { setDraft(event.target.value); setError(''); }} />
            <button type="submit" disabled={Boolean(draftError)}>Apply logic</button>
            {draftError && <p role="alert">{draftError}</p>}
            {error && <p role="alert">{error}</p>}
        </form>
    </section>;
}

function LimitRow({ element, index }: { element: PrimaryQuery | NestedQuery; index: number }) {
    const [draft, setDraft] = useState(element.limit && element.limit > 1 ? String(element.limit) : '');
    const [error, setError] = useState('');
    const name = element.sObjectId.sObjectApiName;
    const errorId = `limit-error-${index}`;

    useEffect(() => {
        setDraft(element.limit && element.limit > 1 ? String(element.limit) : '');
        setError('');
    }, [element.limit]);

    function choose(limit: number | undefined) {
        modelState.getState().setLimit(index, limit);
        setDraft(limit && limit > 1 ? String(limit) : '');
        setError('');
    }

    function applyOther() {
        if (!/^\d+$/.test(draft) || Number(draft) < 2 || Number(draft) > 2000) {
            setError('Enter a whole number from 2 to 2000.');
            return;
        }
        choose(Number(draft));
    }

    return <tr>
        <th scope="row">{name}{element.type === 'SUBQUERY' && <small> · {element.relationshipName}</small>}</th>
        <td><input type="checkbox" aria-label={`All ${name} ${index}`}
            checked={element.limit === undefined} onChange={event => { if (event.target.checked) choose(undefined); }} /></td>
        <td><input type="checkbox" aria-label={`1 ${name} ${index}`}
            checked={element.limit === 1} onChange={event => { if (event.target.checked) choose(1); }} /></td>
        <td><input type="number" min={2} max={2000} step={1} aria-label={`Other ${name} ${index}`}
            aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
            value={draft} onChange={event => setDraft(event.target.value)} onBlur={applyOther}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyOther(); } }} />
            {error && <span id={errorId} role="alert">{error}</span>}</td>
    </tr>;
}

export default function WhereClausePanel() {
    const elements = modelState(state => state.queryState.queryElemnts);
    const blocks = elements.flatMap((element, index) => element.type !== 'RELETED' ? [{ element, index }] : []);
    const withWhere = blocks.filter(({ element }) => element.where?.length);

    return <section aria-labelledby="where-clause-heading">
        <h2 id="where-clause-heading">Where Clause</h2>
        {blocks.length > 0 && <>
            <table className={css.limitTable}>
                <caption>LIMIT by object</caption>
                <thead><tr><th scope="col">Object</th><th scope="col">All</th>
                    <th scope="col">1</th><th scope="col">Other</th></tr></thead>
                <tbody>{blocks.map(({ element, index }) =>
                    <LimitRow key={index} element={element} index={index} />)}</tbody>
            </table>
            <p>All omits LIMIT from the SOQL. Execution still retrieves at most 2000 rows, with more pages loaded on demand.</p>
        </>}
        {withWhere.length === 0 && <p>No WHERE conditions have been added.</p>}
        {withWhere.map(({element, index}) => <WhereGroup key={index} element={element} index={index} />)}
    </section>;
}
