import { QueryRequestError } from './queryContract';

export const DEFAULT_QUERY_LIMIT = 200;
export const MAX_QUERY_LIMIT = 2000;
export const MAX_QUERY_LENGTH = 16_384;

/** Inspect only SQL tokens outside quoted literals and nested subqueries. Salesforce handles full grammar. */
export function enforceReadOnlySoql(input: unknown, requestedLimit: unknown): { query: string; limit: number } {
    if (typeof input !== 'string' || !input.trim() || input.length > MAX_QUERY_LENGTH)
        throw new QueryRequestError('QUERY_INVALID', 400);
    const limit = requestedLimit === undefined ? DEFAULT_QUERY_LIMIT : requestedLimit;
    if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_QUERY_LIMIT)
        throw new QueryRequestError('QUERY_LIMIT_INVALID', 400);
    const query = input.trim();
    const words: { word: string; depth: number; start: number; end: number }[] = [];
    let depth = 0;
    let quoted = false;
    for (let i = 0; i < query.length;) {
        const char = query[i];
        if (quoted) {
            if (char === '\\') { i += 2; continue; }
            if (char === "'") quoted = false;
            i++;
            continue;
        }
        if (char === "'") { quoted = true; i++; continue; }
        if (char === '(') { depth++; i++; continue; }
        if (char === ')') { if (--depth < 0) throw new QueryRequestError('QUERY_INVALID', 400); i++; continue; }
        if (char === ';' || char === '/' && query[i + 1] === '*' || char === '-' && query[i + 1] === '-')
            throw new QueryRequestError('QUERY_INVALID', 400);
        if (/[A-Za-z_]/.test(char)) {
            const start = i;
            while (i < query.length && /[A-Za-z0-9_]/.test(query[i])) i++;
            words.push({ word: query.slice(start, i).toUpperCase(), depth, start, end: i });
            continue;
        }
        i++;
    }
    if (quoted || depth !== 0 || words[0]?.word !== 'SELECT' || words[0].depth !== 0)
        throw new QueryRequestError('QUERY_NOT_READ_ONLY', 400);
    const rootWords = words.filter(token => token.depth === 0);
    if (rootWords.filter(token => token.word === 'SELECT').length !== 1 ||
        rootWords.filter(token => token.word === 'FROM').length !== 1 ||
        rootWords.findIndex(token => token.word === 'FROM') < 1 ||
        !query.slice(words[0].end, rootWords.find(token => token.word === 'FROM')!.start).trim())
        throw new QueryRequestError('QUERY_INVALID', 400);
    const limits = rootWords.filter(token => token.word === 'LIMIT');
    if (limits.length > 1) throw new QueryRequestError('QUERY_INVALID', 400);
    if (limits.length) {
        const token = limits[0];
        const value = /^\s*(\d+)\b/.exec(query.slice(token.end));
        if (!value) throw new QueryRequestError('QUERY_LIMIT_INVALID', 400);
        const declared = Number(value[1]);
        if (!Number.isSafeInteger(declared) || declared < 1 || declared > limit)
            throw new QueryRequestError('QUERY_LIMIT_INVALID', 400);
        return { query, limit: declared };
    }
    const offset = rootWords.find(token => token.word === 'OFFSET');
    return { query: offset ? `${query.slice(0, offset.start).trimEnd()} LIMIT ${limit} ${query.slice(offset.start)}`
        : `${query} LIMIT ${limit}`, limit };
}
