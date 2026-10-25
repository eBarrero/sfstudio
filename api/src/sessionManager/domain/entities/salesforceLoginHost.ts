export type SalesforceLoginHost =
    | 'https://login.salesforce.com'
    | 'https://test.salesforce.com';

export class OAuthContextError extends Error {
    constructor() {
        super('Invalid Salesforce OAuth context');
        this.name = 'OAuthContextError';
    }
}

export function salesforceLoginHost(technology: string): SalesforceLoginHost {
    if (technology === 'SF_Prod') return 'https://login.salesforce.com';
    if (technology === 'SF_Test') return 'https://test.salesforce.com';
    throw new OAuthContextError();
}

export function validateSalesforceLoginHost(
    technology: string,
    loginHost: string,
): SalesforceLoginHost {
    const expected = salesforceLoginHost(technology);
    if (loginHost !== expected) throw new OAuthContextError();
    return expected;
}
