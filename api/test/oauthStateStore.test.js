const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
    OAuthStateError,
    OAuthStateStore,
} = require("../build/sessionManager/domain/entities/oauthStateStore");

const destination = { type: "new", technology: "SF_Prod" };

describe("OAuthStateStore", () => {
    it("generates opaque, unique state values", () => {
        const store = new OAuthStateStore();
        const states = new Set(
            Array.from({ length: 100 }, () => store.issue("workspace", destination, "correlation")),
        );

        assert.equal(states.size, 100);
        for (const state of states) {
            assert.match(state, /^[A-Za-z0-9_-]{43}$/);
        }
    });

    it("returns the destination and flow correlation when consumed", () => {
        const store = new OAuthStateStore({ generateNonce: () => "valid-state" });
        const state = store.issue("workspace", destination, "flow-correlation");

        assert.deepEqual(store.consume(state, "workspace"), {
            destination,
            correlationId: "flow-correlation",
        });
    });

    it("expires state values", () => {
        let now = 1_000;
        const store = new OAuthStateStore({
            now: () => now,
            ttlMs: 100,
            generateNonce: () => "expiring-state",
        });
        const state = store.issue("workspace", destination, "correlation");
        now = 1_100;

        assert.throws(
            () => store.consume(state, "workspace"),
            (error) => error instanceof OAuthStateError && error.reason === "EXPIRED",
        );
    });

    it("rejects another workspace without consuming the owner's state", () => {
        const store = new OAuthStateStore({ generateNonce: () => "bound-state" });
        const state = store.issue("owner", destination, "correlation");

        assert.throws(
            () => store.consume(state, "attacker"),
            (error) => error instanceof OAuthStateError && error.reason === "WORKSPACE_MISMATCH",
        );
        assert.deepEqual(store.consume(state, "owner").destination, destination);
    });

    it("allows a state value to be consumed only once", () => {
        const store = new OAuthStateStore({ generateNonce: () => "single-use-state" });
        const state = store.issue("workspace", destination, "correlation");

        store.consume(state, "workspace");

        assert.throws(
            () => store.consume(state, "workspace"),
            (error) => error instanceof OAuthStateError && error.reason === "INVALID",
        );
    });
});
