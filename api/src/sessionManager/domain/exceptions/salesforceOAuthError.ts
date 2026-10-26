export class SalesforceOAuthError extends Error {
    constructor() {
        super('Salesforce OAuth request failed');
        this.name = 'SalesforceOAuthError';
    }
}
