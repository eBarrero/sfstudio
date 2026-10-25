const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { Sessions } = require("../build/sessionManager/domain/entities/sessions");
const {
    createSessionId,
    isSessionId,
    WorkspaceSession,
    WORKSPACE_SESSION_TTL_MS,
} = require("../build/sessionManager/domain/entities/workspaceSession");

describe("WorkspaceSession", () => {
    it("generates cryptographically random UUID identifiers", () => {
        const identifiers = new Set(Array.from({ length: 100 }, () => createSessionId()));

        assert.equal(identifiers.size, 100);
        for (const identifier of identifiers) {
            assert.equal(isSessionId(identifier), true);
        }
    });

    it("expires after the configured lifetime", () => {
        let now = new Date("2026-10-25T10:00:00.000Z");
        const session = new WorkspaceSession({ now: () => now });

        assert.equal(session.isExpired(), false);
        assert.equal(
            session.getExpiresAt().getTime(),
            now.getTime() + WORKSPACE_SESSION_TTL_MS,
        );

        now = new Date(session.getExpiresAt().getTime());
        assert.equal(session.isExpired(), true);
    });

    it("rotates the identifier and extends expiration", () => {
        const firstId = "00000000-0000-4000-8000-000000000001";
        const secondId = "00000000-0000-4000-8000-000000000002";
        let now = new Date("2026-10-25T10:00:00.000Z");
        const session = new WorkspaceSession({
            id: firstId,
            expiresAt: new Date("2026-10-25T11:00:00.000Z"),
            now: () => now,
            generateId: () => secondId,
        });

        now = new Date("2026-10-25T10:30:00.000Z");
        const rotation = session.rotate();

        assert.equal(rotation.previousId, firstId);
        assert.equal(rotation.sessionId, secondId);
        assert.equal(rotation.expiresAt.getTime(), now.getTime() + WORKSPACE_SESSION_TTL_MS);
    });

    it("invalidates the previous identifier in the session registry", () => {
        const registry = new Sessions();
        const user = registry.addNewUser();
        const previousId = user.getSessionId();

        const rotation = registry.rotateUserSession(user);

        assert.equal(registry.lookUpUserOnCache(previousId), null);
        assert.equal(registry.getUser(rotation.sessionId), user);
    });
});
