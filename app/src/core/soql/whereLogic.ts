/** A condition reference is one-based: C1 selects conditions[0]. */
export type WhereLogicNode =
  | { kind: 'condition'; index: number }
  | { kind: 'AND' | 'OR'; left: WhereLogicNode; right: WhereLogicNode };

export class WhereLogicError extends Error {
  constructor(public readonly code: 'SYNTAX' | 'INDEX_OUT_OF_RANGE' | 'EMPTY') {
    super(code);
  }
}

export function defaultWhereLogic(conditionCount: number): string {
  return Array.from({ length: conditionCount }, (_, index) => `C${index + 1}`).join(' AND ');
}

/** Parse only condition references, AND/OR and balanced parentheses. AND binds before OR. */
export function parseWhereLogic(input: string, conditionCount: number): WhereLogicNode {
  const tokens: string[] = [];
  const matcher = /\s*(C\d+|AND|OR|\(|\))/giy;
  let offset = 0;
  while (offset < input.length) {
    if (/^\s*$/.test(input.slice(offset))) break;
    matcher.lastIndex = offset;
    const match = matcher.exec(input);
    if (!match) throw new WhereLogicError('SYNTAX');
    tokens.push(match[1].toUpperCase());
    offset = matcher.lastIndex;
  }
  if (!tokens.length) throw new WhereLogicError('EMPTY');

  let position = 0;
  const primary = (): WhereLogicNode => {
    const token = tokens[position++];
    if (token === '(') {
      const node = or();
      if (tokens[position++] !== ')') throw new WhereLogicError('SYNTAX');
      return node;
    }
    if (!token?.startsWith('C') || !/^C\d+$/.test(token)) throw new WhereLogicError('SYNTAX');
    const index = Number(token.slice(1));
    if (!Number.isSafeInteger(index) || index < 1 || index > conditionCount)
      throw new WhereLogicError('INDEX_OUT_OF_RANGE');
    return { kind: 'condition', index: index - 1 };
  };
  const and = (): WhereLogicNode => {
    let left = primary();
    while (tokens[position] === 'AND') {
      position += 1;
      left = { kind: 'AND', left, right: primary() };
    }
    return left;
  };
  const or = (): WhereLogicNode => {
    let left = and();
    while (tokens[position] === 'OR') {
      position += 1;
      left = { kind: 'OR', left, right: and() };
    }
    return left;
  };
  const node = or();
  if (position !== tokens.length) throw new WhereLogicError('SYNTAX');
  return node;
}
