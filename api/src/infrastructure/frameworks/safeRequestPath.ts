const REDACTED_SEGMENT = '[REDACTED]';
const safeStaticSegment = /^(?:[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+){0,2}|\.[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+)?)$/i;
const sensitiveWord = /(?:token|secret|password|cookie|cursor|session|oauth|authorization|access|refresh|client|state|code)/i;

/** Keep short static-looking path segments, including filenames and dotfiles. Never log the query string. */
export function safeRequestPath(path: string | undefined, routeTemplate?: string): string {
    if (routeTemplate && routeTemplate.length <= 256 &&
        /^\/(?:[A-Za-z0-9_:-]+\/?)*$/.test(routeTemplate)) return routeTemplate;
    if (!path?.startsWith('/')) return `/${REDACTED_SEGMENT}`;
    const segments = path.split('/').slice(1);
    const visible = segments.slice(0, 8).map(segment => {
        if (segment === '') return '';
        if (!safeStaticSegment.test(segment) || sensitiveWord.test(segment) || segment.length > 64 ||
            /\d{3,}/.test(segment) || segment.length > 24 && !segment.includes('-')) return REDACTED_SEGMENT;
        return segment;
    });
    if (segments.length > 8) visible.push(REDACTED_SEGMENT);
    return `/${visible.join('/')}`;
}
