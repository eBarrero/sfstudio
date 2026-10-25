const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const SalesforceOAuth2 = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/salesforceOAuth2').default;
const { isExpiredSalesforceSession } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/salesforceSessionError');
const { ReauthRequiredError } = require('../build/sessionManager/domain/exceptions/reauthRequiredError');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');

const config = new ConnectionDriverDTO({ tech: Technology.SF_Test });

describe('Salesforce token expiry and revocation', () => {
    it('recognizes structured authentication failures without relying on message text', async () => {
        assert.equal(isExpiredSalesforceSession({ errorCode: 'INVALID_SESSION_ID' }), true);
        assert.equal(isExpiredSalesforceSession({ statusCode: 401 }), true);
        assert.equal(isExpiredSalesforceSession(new Error('expired')), false);
        const driver = new SalesforceOAuth2(config);
        driver.conn = {
            describeGlobal: async () => { throw { errorCode: 'INVALID_SESSION_ID' }; },
        };
        await assert.rejects(() => driver.getDescribeGlobal(), ReauthRequiredError);
    });

    it('releases the local connection even when Salesforce cannot revoke its access token', async () => {
        const driver = new SalesforceOAuth2(config);
        let calls = 0;
        driver.conn = { logout: async () => { calls += 1; throw new Error('network unavailable'); } };
        await driver.revoke();
        assert.equal(calls, 1);
        assert.equal(driver.conn, undefined);
    });
});
