const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
    ConfigurationError,
    parseEnvironment,
} = require("../build/config/environment");

const completeEnvironment = {
    ENV: "PROD",
    PORT: "8080",
    CLIENT_ID: "client-id-for-tests",
    CLIENT_SECRET: "client-secret-for-tests",
    REDIRECT_URI: "https://sfstudio.example.test/",
    API_SF_VERSION: "61.0",
    MONGO: "mongodb://database.example.test/sfstudio",
};

describe("parseEnvironment", () => {
    it("returns a typed production configuration", () => {
        const result = parseEnvironment(completeEnvironment);

        assert.deepEqual(result, {
            environment: "PROD",
            port: 8080,
            clientId: "client-id-for-tests",
            clientSecret: "client-secret-for-tests",
            redirectUri: "https://sfstudio.example.test",
            callbackUrl: "https://sfstudio.example.test/api/callback",
            salesforceApiVersion: "61.0",
            mongoUrl: "mongodb://database.example.test/sfstudio",
        });
    });

    for (const variable of ["CLIENT_ID", "CLIENT_SECRET", "REDIRECT_URI", "MONGO"]) {
        it(`rejects PROD when ${variable} is missing`, () => {
            const environment = { ...completeEnvironment };
            delete environment[variable];

            assert.throws(
                () => parseEnvironment(environment),
                (error) => error instanceof ConfigurationError
                    && error.message === `Missing required environment variables: ${variable}`,
            );
        });
    }

    it("requires external configuration in DEV", () => {
        assert.throws(
            () => parseEnvironment({ ENV: "DEV" }),
            /CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, MONGO/,
        );
    });

    it("uses isolated defaults in TESTING", () => {
        const result = parseEnvironment({ ENV: "TESTING" });

        assert.equal(result.environment, "TESTING");
        assert.equal(result.callbackUrl, "http://localhost:3000/api/callback");
        assert.equal(result.mongoUrl, "mongodb://127.0.0.1:27017/sfstudio-testing");
    });

    it("rejects invalid environment and port values", () => {
        assert.throws(() => parseEnvironment({ ENV: "UNKNOWN" }), /ENV must be/);
        assert.throws(
            () => parseEnvironment({ ENV: "TESTING", PORT: "not-a-port" }),
            /PORT must be/,
        );
    });
});
