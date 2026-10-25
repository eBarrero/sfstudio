const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { afterEach, describe, it } = require("node:test");
const express = require("express");
const { createApp } = require("../build/app");
const { SessionDTO } = require("../build/sessionManager/domain/dtos/sessionDTO");
const { OAuthStateStore } = require("../build/sessionManager/domain/entities/oauthStateStore");
const {
    ErrorMessages,
    SessionError,
} = require("../build/sessionManager/domain/exceptions/sessionError");
const {
    RequestedConnectionController,
    RequestConnectionController,
    SignInController,
} = require("../build/sessionManager/infrastructure/input_adapter/httpControllers");
const {
    SESSION_COOKIE_NAME,
} = require("../build/sessionManager/infrastructure/input_adapter/sessionCookie");

const openServers = new Set();

function emptySession() {
    return new SessionDTO({ version: 1, connections: [], activeOrgKey: null });
}

async function startApplication(router, environment = "TESTING") {
    const app = createApp({
        apiRouter: router,
        readinessProbe: { isReady: async () => true },
        environment,
    });
    const server = await new Promise((resolve) => {
        const candidate = app.listen(0, "127.0.0.1", () => resolve(candidate));
    });
    openServers.add(server);
    const address = server.address();

    return `http://127.0.0.1:${address.port}`;
}

function createSignInRouter(useCase, environment = "TESTING") {
    const controller = new SignInController(useCase, environment);
    const router = express.Router();
    router.get("/api/init", controller.login.bind(controller));
    router.get("/api/v1/workspace", controller.workspace.bind(controller));
    return router;
}

afterEach(async () => {
    await Promise.all([...openServers].map((server) => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    })));
    openServers.clear();
});

describe("workspace session HTTP contract", () => {
    it("uses OrgKey rather than an array index for reauthorization", async () => {
        const sessionId = randomUUID();
        const orgKey = '00D000000000001:005000000000001';
        const requested = [];
        const useCase = {
            getConfiguredTechnology: (_sessionId, key) => {
                if (key !== orgKey) throw new SessionError('Connection not found in workspace');
                requested.push(key);
                return 'SF_Test';
            },
            toConfiguredConnection: (_sessionId, key) => {
                requested.push(key);
                return 'https://example.invalid/oauth';
            },
        };
        const controller = new RequestConnectionController(useCase, {}, new OAuthStateStore());
        const router = express.Router();
        router.get('/api/v1/connections/:orgKey/authorize', (req, _res, next) => {
            req.appSessionId = sessionId;
            next();
        }, controller.getUrlConnection.bind(controller));
        const baseUrl = await startApplication(router);
        const invalid = await fetch(`${baseUrl}/api/v1/connections/0/authorize`, { redirect: 'manual' });
        assert.equal(invalid.status, 400);
        assert.equal((await invalid.json()).error.code, 'ORG_KEY_INVALID');
        const unknown = await fetch(`${baseUrl}/api/v1/connections/00D000000000002:005000000000001/authorize`, { redirect: 'manual' });
        assert.equal(unknown.status, 404);
        assert.equal((await unknown.json()).error.code, 'ORG_NOT_FOUND');
        const valid = await fetch(`${baseUrl}/api/v1/connections/${orgKey}/authorize`, { redirect: 'manual' });
        assert.equal(valid.status, 302);
        assert.deepEqual(requested, [orgKey, orgKey]);
    });

    it("returns a versioned JSON workspace without a session cookie", async () => {
        const useCase = { getSessionStatus: async () => emptySession(), getStatus: () => "ok" };
        const baseUrl = await startApplication(createSignInRouter(useCase));
        const response = await fetch(`${baseUrl}/api/v1/workspace`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { version: 1, connections: [], activeOrgKey: null });
    });

    it("returns the public JSON contract for an authenticated workspace", async () => {
        const sessionId = randomUUID();
        const useCase = { getSessionStatus: async () => emptySession(), getStatus: () => "ok" };
        const baseUrl = await startApplication(createSignInRouter(useCase));
        const response = await fetch(`${baseUrl}/api/v1/workspace`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionId}` },
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { version: 1, connections: [], activeOrgKey: null });
    });

    it("returns a new workspace marker when the cookie is absent", async () => {
        const useCase = {
            getSessionStatus: async () => emptySession(),
            getStatus: () => "ok",
        };
        const baseUrl = await startApplication(createSignInRouter(useCase));

        const response = await fetch(`${baseUrl}/api/init`);

        assert.equal(response.status, 200);
        assert.equal(await response.json(), "newsession");
    });

    it("accepts a valid cookie without exposing its identifier", async () => {
        const sessionId = randomUUID();
        const useCase = {
            getSessionStatus: async (candidate) => {
                assert.equal(candidate, sessionId);
                return emptySession();
            },
            getStatus: () => "ok",
        };
        const baseUrl = await startApplication(createSignInRouter(useCase));

        const response = await fetch(`${baseUrl}/api/init`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionId}` },
        });
        const publicSession = JSON.parse(Buffer.from(await response.json(), "base64").toString("utf8"));

        assert.equal(response.status, 200);
        assert.deepEqual(publicSession, { version: 1, connections: [], activeOrgKey: null });
        assert.equal("sessionId" in publicSession, false);
    });

    it("rejects a malformed cookie and clears it", async () => {
        const useCase = {
            getSessionStatus: async () => emptySession(),
            getStatus: () => "ok",
        };
        const baseUrl = await startApplication(createSignInRouter(useCase));

        const response = await fetch(`${baseUrl}/api/init`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=manipulated` },
        });

        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "SESSION_INVALID");
        assert.match(response.headers.get("set-cookie"), new RegExp(`^${SESSION_COOKIE_NAME}=;`));
    });

    it("rejects a structurally valid but unknown cookie", async () => {
        const manipulatedId = randomUUID();
        const useCase = {
            getSessionStatus: async () => {
                throw new SessionError(ErrorMessages.SESSION_INVALID);
            },
            getStatus: () => "ok",
        };
        const baseUrl = await startApplication(createSignInRouter(useCase));

        const response = await fetch(`${baseUrl}/api/init`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${manipulatedId}` },
        });

        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "SESSION_INVALID");
    });

    it("rejects and clears an expired session", async () => {
        const sessionId = randomUUID();
        const useCase = {
            getSessionStatus: async () => {
                throw new SessionError(ErrorMessages.SESSION_INVALID);
            },
            getStatus: () => "ok",
        };
        const baseUrl = await startApplication(createSignInRouter(useCase));

        const response = await fetch(`${baseUrl}/api/init`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionId}` },
        });

        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "SESSION_INVALID");
        assert.match(response.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
    });

    it("sets a hardened production cookie with the rotated identifier", async () => {
        const previousId = randomUUID();
        const rotatedId = randomUUID();
        const useCase = {
            exe: async (candidate) => {
                assert.equal(candidate, previousId);
                return rotatedId;
            },
        };
        const oauthStateStore = new OAuthStateStore();
        const state = oauthStateStore.issue(
            previousId,
            { type: "new", technology: "SF_Prod" },
            randomUUID(),
        );
        const controller = new RequestedConnectionController(useCase, oauthStateStore, "PROD");
        const router = express.Router();
        router.get("/api/callback", controller.salesforce.bind(controller));
        const baseUrl = await startApplication(router, "PROD");

        const response = await fetch(`${baseUrl}/api/callback?code=test-code&state=${state}`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${previousId}` },
            redirect: "manual",
        });
        const setCookie = response.headers.get("set-cookie");

        assert.equal(response.status, 302);
        assert.match(setCookie, new RegExp(`^${SESSION_COOKIE_NAME}=${rotatedId}`));
        assert.match(setCookie, /HttpOnly/i);
        assert.match(setCookie, /Secure/i);
        assert.match(setCookie, /SameSite=Lax/i);
        assert.match(setCookie, /Path=\//i);
        assert.match(setCookie, /Max-Age=28800/i);
        assert.equal(setCookie.includes(previousId), false);
    });
});
