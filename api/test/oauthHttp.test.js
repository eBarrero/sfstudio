const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { afterEach, describe, it } = require("node:test");
const express = require("express");
const { createApp } = require("../build/app");
const { StructuredLogger } = require("../build/infrastructure/frameworks/structuredLogger");
const { OAuthStateStore } = require("../build/sessionManager/domain/entities/oauthStateStore");
const {
    RequestConnectionController,
    RequestedConnectionController,
} = require("../build/sessionManager/infrastructure/input_adapter/httpControllers");
const {
    OAUTH_FLOW_COOKIE_NAME,
    SESSION_COOKIE_NAME,
} = require("../build/sessionManager/infrastructure/input_adapter/sessionCookie");

const openServers = new Set();
const silentLogger = new StructuredLogger({
    log: () => {},
    warn: () => {},
    error: () => {},
});

async function startApplication(router) {
    const app = createApp({
        apiRouter: router,
        readinessProbe: { isReady: async () => true },
        environment: "TESTING",
        requestLogger: silentLogger,
    });
    const server = await new Promise((resolve) => {
        const candidate = app.listen(0, "127.0.0.1", () => resolve(candidate));
    });
    openServers.add(server);
    const address = server.address();
    return `http://127.0.0.1:${address.port}`;
}

function callbackHarness(stateStore) {
    let salesforceCalls = 0;
    const requestedUseCase = {
        exe: async () => {
            salesforceCalls += 1;
            return randomUUID();
        },
    };
    const controller = new RequestedConnectionController(
        requestedUseCase,
        stateStore,
        "TESTING",
        silentLogger,
    );
    const router = express.Router();
    router.get("/api/callback", controller.salesforce.bind(controller));

    return {
        router,
        getSalesforceCalls: () => salesforceCalls,
    };
}

afterEach(async () => {
    await Promise.all([...openServers].map((server) => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    })));
    openServers.clear();
});

describe("OAuth HTTP flow", () => {
    it("creates state associated with a pending workspace and destination", async () => {
        const stateStore = new OAuthStateStore();
        const requestUseCase = {
            toNewConnection: (_configuration, state) =>
                `https://login.example.test/authorize?state=${state}`,
            getConfiguredTechnology: () => "SF_Prod",
            toConfiguredConnection: () => "",
        };
        const signInUseCase = {
            getSessionStatus: async () => {
                throw new Error("A new workspace must not require an existing session");
            },
            getStatus: () => "ok",
        };
        const controller = new RequestConnectionController(
            requestUseCase,
            signInUseCase,
            stateStore,
            "TESTING",
            silentLogger,
        );
        const router = express.Router();
        router.get("/api/auth/:tech", controller.getNewUrlConnection.bind(controller));
        const baseUrl = await startApplication(router);

        const response = await fetch(`${baseUrl}/api/auth/SF_Prod`, { redirect: "manual" });
        const location = response.headers.get("location");
        const state = new URL(location).searchParams.get("state");
        const setCookie = response.headers.get("set-cookie");
        const binding = new RegExp(`${OAUTH_FLOW_COOKIE_NAME}=([^;]+)`).exec(setCookie)[1];
        const consumed = stateStore.consume(state, binding);

        assert.equal(response.status, 302);
        assert.deepEqual(consumed.destination, { type: "new", technology: "SF_Prod" });
        assert.match(consumed.correlationId, /^[0-9a-f-]{36}$/i);
    });

    it("accepts a valid callback once and only then calls Salesforce", async () => {
        const workspace = randomUUID();
        const stateStore = new OAuthStateStore();
        const state = stateStore.issue(
            workspace,
            { type: "new", technology: "SF_Prod" },
            randomUUID(),
        );
        const harness = callbackHarness(stateStore);
        const baseUrl = await startApplication(harness.router);

        const response = await fetch(`${baseUrl}/api/callback?code=valid-code&state=${state}`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${workspace}` },
            redirect: "manual",
        });

        assert.equal(response.status, 302);
        assert.equal(harness.getSalesforceCalls(), 1);
    });

    it("rejects a callback without state before calling Salesforce", async () => {
        const harness = callbackHarness(new OAuthStateStore());
        const baseUrl = await startApplication(harness.router);

        const response = await fetch(`${baseUrl}/api/callback?code=valid-code`);

        assert.equal(response.status, 400);
        assert.equal((await response.json()).error.code, "OAUTH_CALLBACK_INVALID");
        assert.equal(harness.getSalesforceCalls(), 0);
    });

    it("rejects expired state before calling Salesforce", async () => {
        let now = 1_000;
        const workspace = randomUUID();
        const stateStore = new OAuthStateStore({ now: () => now, ttlMs: 100 });
        const state = stateStore.issue(
            workspace,
            { type: "new", technology: "SF_Prod" },
            randomUUID(),
        );
        now = 1_100;
        const harness = callbackHarness(stateStore);
        const baseUrl = await startApplication(harness.router);

        const response = await fetch(`${baseUrl}/api/callback?code=valid-code&state=${state}`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${workspace}` },
        });

        assert.equal(response.status, 400);
        assert.equal((await response.json()).error.code, "OAUTH_STATE_INVALID");
        assert.equal(harness.getSalesforceCalls(), 0);
    });

    it("rejects state belonging to another workspace before calling Salesforce", async () => {
        const stateStore = new OAuthStateStore();
        const state = stateStore.issue(
            randomUUID(),
            { type: "new", technology: "SF_Prod" },
            randomUUID(),
        );
        const harness = callbackHarness(stateStore);
        const baseUrl = await startApplication(harness.router);

        const response = await fetch(`${baseUrl}/api/callback?code=valid-code&state=${state}`, {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${randomUUID()}` },
        });

        assert.equal(response.status, 401);
        assert.equal((await response.json()).error.code, "OAUTH_STATE_MISMATCH");
        assert.equal(harness.getSalesforceCalls(), 0);
    });

    it("rejects replay without calling Salesforce again", async () => {
        const workspace = randomUUID();
        const stateStore = new OAuthStateStore();
        const state = stateStore.issue(
            workspace,
            { type: "new", technology: "SF_Prod" },
            randomUUID(),
        );
        const harness = callbackHarness(stateStore);
        const baseUrl = await startApplication(harness.router);
        const url = `${baseUrl}/api/callback?code=valid-code&state=${state}`;
        const options = {
            headers: { Cookie: `${SESSION_COOKIE_NAME}=${workspace}` },
            redirect: "manual",
        };

        const firstResponse = await fetch(url, options);
        const replayResponse = await fetch(url, options);

        assert.equal(firstResponse.status, 302);
        assert.equal(replayResponse.status, 400);
        assert.equal((await replayResponse.json()).error.code, "OAUTH_STATE_INVALID");
        assert.equal(harness.getSalesforceCalls(), 1);
    });
});
