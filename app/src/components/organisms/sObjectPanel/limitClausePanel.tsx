import { useEffect, useState } from 'react';
import modelState from '../../../store/modelState';
import css from './style.module.css';

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

export default function LimitClausePanel() {
    const elements = modelState(state => state.queryState.queryElemnts);
    const blocks = elements.flatMap((element, index) => element.type !== 'RELETED' ? [{ element, index }] : []);

    return <section aria-labelledby="limit-clause-heading">
        <h2 id="limit-clause-heading">Limit Clause</h2>
        {blocks.length === 0 ? <p>No query blocks are available.</p> : <>
            <table className={css.limitTable}>
                <caption>LIMIT by object</caption>
                <thead><tr><th scope="col">Object</th><th scope="col">All</th>
                    <th scope="col">1</th><th scope="col">Other</th></tr></thead>
                <tbody>{blocks.map(({ element, index }) =>
                    <LimitRow key={index} element={element} index={index} />)}</tbody>
            </table>
            <p>All omits LIMIT from the SOQL. Execution still retrieves at most 2000 rows, with more pages loaded on demand.</p>
        </>}
    </section>;
}
