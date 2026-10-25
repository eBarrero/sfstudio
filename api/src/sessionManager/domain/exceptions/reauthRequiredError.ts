export class ReauthRequiredError extends Error {
    constructor() {
        super('Salesforce connection is not active');
        this.name = 'ReauthRequiredError';
    }
}
