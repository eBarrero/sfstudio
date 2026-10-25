import { AuthorizationCode, ModuleOptions } from 'simple-oauth2';
import jsforce, { Connection } from 'jsforce';
import { CALLBACK_URL, CLIENT_ID, CLIENT_SECRET } from '../../../../config/environment';
import { SalesforceLoginHost } from '../../../domain/entities/salesforceLoginHost';

export interface SalesforceLoginResult {
    connection: Connection;
    organizationId: string;
    userId: string;
    userName: string;
    email: string;
    instanceUrl: string;
}

export interface SalesforceOAuthClient {
    authorizationUrl(loginHost: SalesforceLoginHost, state: string): string;
    exchangeCode(loginHost: SalesforceLoginHost, code: string): Promise<SalesforceLoginResult>;
}

export class LiveSalesforceOAuthClient implements SalesforceOAuthClient {
    authorizationUrl(loginHost: SalesforceLoginHost, state: string): string {
        const authConfig: ModuleOptions = {
            client: { id: CLIENT_ID, secret: CLIENT_SECRET },
            auth: {
                tokenHost: loginHost,
                tokenPath: '/services/oauth2/token',
                authorizePath: '/services/oauth2/authorize',
            },
        };
        const url = new URL(new AuthorizationCode(authConfig).authorizeURL({
            redirect_uri: CALLBACK_URL,
            scope: 'api web id profile email',
            state,
        }));
        url.searchParams.set('prompt', 'login');
        return url.toString();
    }

    async exchangeCode(loginHost: SalesforceLoginHost, code: string): Promise<SalesforceLoginResult> {
        const oauth2 = new jsforce.OAuth2({
            loginUrl: loginHost,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            redirectUri: CALLBACK_URL,
        });
        const connection = new jsforce.Connection({ oauth2 });
        await connection.authorize(code);
        const identity = await connection.identity();
        return {
            connection,
            organizationId: identity.organization_id,
            userId: identity.user_id,
            userName: identity.username,
            email: identity.email,
            instanceUrl: connection.instanceUrl,
        };
    }
}
