const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");
const express = require("express");
const { createApp } = require("../build/app");

const openServers = new Set();

async function startApplication(isReady) {
    const app = createApp({
        apiRouter: express.Router(),
        readinessProbe: { isReady },
        environment: "TESTING",
    });
    const server = await new Promise((resolve) => {
        const candidate = app.listen(0, "127.0.0.1", () => resolve(candidate));
    });
    openServers.add(server);
    const address = server.address();

    return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
    await Promise.all([...openServers].map((server) => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    })));
    openServers.clear();
});

describe("health endpoints", () => {
    it("reports liveness without consulting MongoDB", async () => {
        let probeCalls = 0;
        const baseUrl = await startApplication(async () => {
            probeCalls += 1;
            return false;
        });

        const response = await fetch(`${baseUrl}/health`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
        assert.equal(probeCalls, 0);
    });

    it("reports readiness when MongoDB is available", async () => {
        const baseUrl = await startApplication(async () => true);

        const response = await fetch(`${baseUrl}/ready`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ready" });
    });

    it("reports not ready when MongoDB is unavailable", async () => {
        const baseUrl = await startApplication(async () => false);

        const response = await fetch(`${baseUrl}/ready`);

        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { status: "not_ready" });
    });

    it("does not expose connection errors", async () => {
        const sensitiveDetail = "mongodb://user:password@database.example.test";
        const baseUrl = await startApplication(async () => {
            throw new Error(sensitiveDetail);
        });

        const response = await fetch(`${baseUrl}/ready`);
        const body = JSON.stringify(await response.json());

        assert.equal(response.status, 503);
        assert.equal(body.includes(sensitiveDetail), false);
    });
});
