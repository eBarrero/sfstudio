const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { StructuredLogger } = require("../build/infrastructure/frameworks/structuredLogger");

describe("StructuredLogger", () => {
    it("emits JSON with correlation data and redacts sensitive fields", () => {
        const entries = [];
        const sink = {
            log: (entry) => entries.push(entry),
            warn: (entry) => entries.push(entry),
            error: (entry) => entries.push(entry),
        };
        const logger = new StructuredLogger(
            sink,
            () => new Date("2026-10-25T12:00:00.000Z"),
        );
        const secrets = {
            cookie: "workspace-cookie-value",
            code: "oauth-code-value",
            accessToken: "access-token-value",
            clientSecret: "client-secret-value",
            email: "person@example.test",
            authorizationUrl: "https://login.example.test/authorize?code=url-code&state=url-state",
        };

        logger.error("oauth.test", {
            correlationId: "correlation-safe",
            ...secrets,
            errorMessage: [
                "callback for leaked.person@example.test failed",
                "at https://login.example.test/oauth/authorize?client_id=public&state=text-state",
                "with callback?code=message-code&state=message-state",
            ].join(" "),
        });

        assert.equal(entries.length, 1);
        const serialized = entries[0];
        for (const secret of Object.values(secrets)) {
            assert.equal(serialized.includes(secret), false);
        }
        assert.equal(serialized.includes("message-code"), false);
        assert.equal(serialized.includes("message-state"), false);
        assert.equal(serialized.includes("leaked.person@example.test"), false);
        assert.equal(serialized.includes("https://login.example.test/oauth/authorize"), false);

        const parsed = JSON.parse(serialized);
        assert.equal(parsed.level, "error");
        assert.equal(parsed.event, "oauth.test");
        assert.equal(parsed.correlationId, "correlation-safe");
        assert.equal(parsed.cookie, "[REDACTED]");
        assert.equal(parsed.code, "[REDACTED]");
    });
});
