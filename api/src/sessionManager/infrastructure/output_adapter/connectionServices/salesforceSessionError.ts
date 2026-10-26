/** Salesforce and jsforce use these structured fields for an expired session. */
export function isExpiredSalesforceSession(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as Record<string, unknown>;
    return value.errorCode === 'INVALID_SESSION_ID' ||
        value.code === 'INVALID_SESSION_ID' ||
        value.statusCode === 401 || value.status === 401;
}
