const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const SalesforceOAuth2 = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/salesforceOAuth2').default;
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { SalesforceOAuthError } = require('../build/sessionManager/domain/exceptions/salesforceOAuthError');
const { LiveSalesforceOAuthClient } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/salesforceOAuthClient');

const organizationId = '00D000000000001';
const userId = '005000000000001';

describe('Salesforce OAuth host binding', () => {
    it('builds real authorization URLs on the selected Salesforce host', () => {
        const client = new LiveSalesforceOAuthClient();
        for (const host of ['https://login.salesforce.com', 'https://test.salesforce.com']) {
            const url = new URL(client.authorizationUrl(host, 'opaque-state'));
            assert.equal(url.origin, host);
            assert.equal(url.pathname, '/services/oauth2/authorize');
            assert.equal(url.searchParams.get('state'), 'opaque-state');
        }
    });

    for (const [technology, expectedHost] of [
        [Technology.SF_Prod, 'https://login.salesforce.com'],
        [Technology.SF_Test, 'https://test.salesforce.com'],
    ]) {
        it(`uses ${expectedHost} for both OAuth steps and normalizes the connection`, async () => {
            const calls = [];
            const fakeClient = {
                authorizationUrl: (host, state) => {
                    calls.push(['authorize', host, state]);
                    return `${host}/services/oauth2/authorize?state=${state}`;
                },
                exchangeCode: async (host, code) => {
                    calls.push(['exchange', host, code]);
                    return {
                        connection: {},
                        organizationId,
                        userId,
                        userName: 'fixture-user',
                        email: 'fixture@example.invalid',
                        instanceUrl: 'https://sample.my.salesforce.com',
                    };
                },
            };
            const config = new ConnectionDriverDTO({
                tech: technology,
                code: 'fixture-code',
                instanceUrl: 'https://untrusted.invalid',
            });
            const driver = new SalesforceOAuth2(config, fakeClient);
            assert.equal(driver.requestAuthorization('opaque-state'),
                `${expectedHost}/services/oauth2/authorize?state=opaque-state`);
            const result = await driver.login();
            assert.deepEqual(calls, [
                ['authorize', expectedHost, 'opaque-state'],
                ['exchange', expectedHost, 'fixture-code'],
            ]);
            assert.deepEqual(result.toDatabse(), {
                tech: technology,
                dbId: organizationId,
                dbName: 'sample',
                userId,
                userName: 'fixture-user',
                instanceUrl: 'https://sample.my.salesforce.com',
                email: 'fixture@example.invalid',
                alias: 'sample',
                loginHost: expectedHost,
                contractVersion: 1,
            });
        });
    }

    it('never exposes a Salesforce failure message', async () => {
        const driver = new SalesforceOAuth2(
            new ConnectionDriverDTO({ tech: Technology.SF_Prod, code: 'secret-code' }),
            {
                authorizationUrl: () => { throw new Error('secret authorization URL'); },
                exchangeCode: async () => { throw new Error('secret-code and access token'); },
            },
        );
        assert.throws(() => driver.requestAuthorization('state'), SalesforceOAuthError);
        await assert.rejects(() => driver.login(), (error) =>
            error instanceof SalesforceOAuthError &&
            !error.message.includes('secret') &&
            !error.message.includes('token'));
    });

    it('rejects a host inconsistent with the chosen Salesforce environment', () => {
        assert.throws(() => new ConnectionDriverDTO({
            tech: Technology.SF_Prod,
            loginHost: 'https://test.salesforce.com',
        }));
        assert.throws(() => new ConnectionDriverDTO({
            tech: Technology.SF_Test,
            loginHost: 'https://untrusted.invalid',
        }));
    });
});
