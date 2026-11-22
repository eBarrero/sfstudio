import { useEffect, useState } from 'react';
import { defaultWhereLogic, effectiveWhereLogic, parseWhereLogic, WhereLogicError } from '../../../core/soql/whereLogic';
import { qualifiedFieldName } from '../../../core/soql/whereOwnership';
import { legacyConditionPreview } from '../../../core/soql/legacyAdapter';
import modelState from '../../../store/modelState';
import { whereFieldLabel } from '../../../services/salesforceSchema/whereFieldLabel';
import css from './style.module.css';

function WhereGroup({ element, index, queryState }: { element: PrimaryQuery | NestedQuery; index: number; queryState: QueryState }) {
    const conditions = element.where ?? [];
    const storedLogic = element.whereLogic ?? defaultWhereLogic(conditions.length);
    const effectiveLogic = effectiveWhereLogic(storedLogic, conditions.map(condition => condition.enabled !== false));
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
                <li key={conditionIndex} className={condition.enabled === false ? css.inactiveCondition : undefined}>
                    <label><input type="checkbox" aria-label={`Active C${conditionIndex + 1} for ${element.sObjectId.sObjectApiName}`}
                        checked={condition.enabled !== false}
                        onChange={event => modelState.getState().setWhereConditionEnabled(index, conditionIndex, event.target.checked)} />
                        <strong>C{conditionIndex + 1}</strong></label>{' '}
                    <code>{legacyConditionPreview(condition)}</code>{' '}
                    <small>({qualifiedFieldName(condition.field)})</small>{' '}
                    <small>({whereFieldLabel(queryState, index, condition.field) ?? 'Label unavailable'})</small>
                    {condition.enabled === false && <span> Inactive</span>}
                </li>)}
        </ol>
        <p role="status">Effective WHERE logic: {effectiveLogic.expression ?? 'No WHERE applied'}</p>
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

export default function WhereClausePanel() {
    const queryState = modelState(state => state.queryState);
    const elements = queryState.queryElemnts;
    const blocks = elements.flatMap((element, index) => element.type !== 'RELETED' ? [{ element, index }] : []);
    const withWhere = blocks.filter(({ element }) => element.where?.length);

    return <section aria-labelledby="where-clause-heading">
        <h2 id="where-clause-heading">Where Clause</h2>
        {withWhere.length === 0 && <p>No WHERE conditions have been added.</p>}
        {withWhere.map(({element, index}) => <WhereGroup key={index} element={element} index={index} queryState={queryState} />)}
    </section>;
}
