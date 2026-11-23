const REDACTED_SEGMENT = '[REDACTED]';
const safeSlug = /^[a-z][a-z0-9_-]{0,31}(?:\.html)?$/;
const sensitiveWord = /(?:token|secret|password|cookie|cursor|session|oauth|authorization|access|refresh|client|state|code)/i;

/** Keep only short static-looking path segments. Never inspect or log the query string. */
export function safeRequestPath(path: string | undefined, routeTemplate?: string): string {
    if (routeTemplate && routeTemplate.length <= 256 &&
        /^\/(?:[A-Za-z0-9_:-]+\/?)*$/.test(routeTemplate)) return routeTemplate;
    if (!path?.startsWith('/')) return `/${REDACTED_SEGMENT}`;
    const segments = path.split('/').slice(1);
    const visible = segments.slice(0, 8).map(segment => {
        if (segment === '') return '';
        if (!safeSlug.test(segment) || sensitiveWord.test(segment) ||
            /\d{3,}/.test(segment) || segment.length > 24 && !segment.includes('-')) return REDACTED_SEGMENT;
        return segment;
    });
    if (segments.length > 8) visible.push(REDACTED_SEGMENT);
    return `/${visible.join('/')}`;
}
