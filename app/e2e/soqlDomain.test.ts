import { escapeLiteral, MAX_PARENT_TO_CHILD_LEVELS, renderQuery, SoqlValidationError, validateQuery, type RootQuery } from '../src/core/soql/domain';

const base = (select: RootQuery['select']): RootQuery => ({ kind: 'root', from: 'Account', select, limit: 50 });
const field = (path: string) => ({ kind: 'expression' as const, expression: { kind: 'field' as const, path } });

describe('pure SOQL domain', () => {
  test.each(['ALL', 'CUSTOM', 'STANDARD'] as const)('renders FIELDS(%s) only once', scope => {
    expect(renderQuery(base([{ kind: 'fields', scope }]))).toBe(`SELECT FIELDS(${scope}) FROM Account LIMIT 50`);
  });

  test('renders parent fields, child query, WHERE, ORDER BY and OFFSET deterministically', () => {
    const query: RootQuery = { ...base([field('Name'), field('Owner.Name'), {
      kind: 'subquery', query: { kind: 'child', relationship: 'Contacts', select: [field('Email')], limit: 2 },
    }]), where: { kind: 'comparison', field: 'Name', operator: 'LIKE', value: { kind: 'text', value: "O'Reilly%" } },
    orderBy: [{ field: 'Name', direction: 'ASC' }], offset: 10 };
    const expected = "SELECT Name, Owner.Name, (SELECT Email FROM Contacts LIMIT 2) FROM Account WHERE Name LIKE 'O\\'Reilly%' ORDER BY Name ASC LIMIT 50 OFFSET 10";
    expect(renderQuery(query)).toBe(expected);
    expect(renderQuery(query)).toBe(expected);
  });

  test('renders nested child relationships through five object levels and rejects a sixth', () => {
    const query = base([field('Name')]);
    let select = query.select;
    for (let depth = 2; depth <= MAX_PARENT_TO_CHILD_LEVELS; depth++) {
      const child = { kind: 'subquery' as const, query: { kind: 'child' as const,
        relationship: `Children${depth}`, select: [field('Name')] } };
      select.push(child);
      select = child.query.select;
    }
    expect(validateQuery(query)).toEqual([]);
    expect(renderQuery(query)).toBe('SELECT Name, (SELECT Name, (SELECT Name, (SELECT Name, (SELECT Name FROM Children5) FROM Children4) FROM Children3) FROM Children2) FROM Account LIMIT 50');
    select.push({ kind: 'subquery', query: { kind: 'child', relationship: 'Children6', select: [field('Name')] } });
    expect(validateQuery(query).map(error => error.code)).toContain('CHILD_RELATIONSHIP_DEPTH_EXCEEDED');
    expect(() => renderQuery(query)).toThrow(SoqlValidationError);
  });

  test('renders grouped aggregate', () => {
    const query: RootQuery = { ...base([field('Industry'), { kind: 'expression', expression: { kind: 'function', name: 'COUNT' } }]),
      groupBy: [{ kind: 'field', path: 'Industry' }] };
    expect(renderQuery(query)).toBe('SELECT Industry, COUNT() FROM Account GROUP BY Industry LIMIT 50');
  });

  test('returns structural errors with locations', () => {
    const query = base([]);
    query.from = 'Account;DELETE';
    expect(validateQuery(query)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SELECT_REQUIRED', path: 'query.select' }),
      expect.objectContaining({ code: 'INVALID_IDENTIFIER', path: 'query.from' }),
    ]));
    expect(() => renderQuery(query)).toThrow(SoqlValidationError);
  });

  test('rejects mixed FIELDS and ungrouped aggregates', () => {
    expect(validateQuery(base([{ kind: 'fields', scope: 'ALL' }, field('Name')]))[0].code).toBe('FIELDS_MUST_STAND_ALONE');
    const aggregate = base([field('Name'), { kind: 'expression', expression: { kind: 'function', name: 'COUNT' } }]);
    expect(validateQuery(aggregate).map(error => error.code)).toContain('GROUP_BY_REQUIRED');
  });

  test('escapes all text quote, backslash and newline positions', () => {
    for (let i = 0; i < 40; i++) {
      const sample = `x${'\\'.repeat(i % 5)}${"'".repeat(i % 4)}\n${i}`;
      const escaped = escapeLiteral({ kind: 'text', value: sample });
      expect(escaped.startsWith("'") && escaped.endsWith("'")).toBe(true);
      expect(escaped).not.toContain('\n');
      expect(escaped.slice(1, -1)).toBe(sample.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n'));
    }
  });
});
