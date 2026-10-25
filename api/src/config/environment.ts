
export type RuntimeEnvironment = "DEV" | "TESTING" | "PROD";

export interface AppConfig {
    environment: RuntimeEnvironment;
    port: number;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    callbackUrl: string;
    salesforceApiVersion: string;
    mongoUrl: string;
}

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

const REQUIRED_EXTERNAL_VARIABLES = [
    "CLIENT_ID",
    "CLIENT_SECRET",
    "REDIRECT_URI",
    "MONGO",
] as const;

function readEnvironment(value: string | undefined): RuntimeEnvironment {
    const environment = (value ?? "TESTING").toUpperCase();

    if (environment === "DEV" || environment === "TESTING" || environment === "PROD") {
        return environment;
    }

    throw new ConfigurationError("ENV must be DEV, TESTING or PROD");
}

function readPort(value: string | undefined): number {
    const port = Number(value ?? "3000");

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new ConfigurationError("PORT must be an integer between 1 and 65535");
    }

    return port;
}

function withoutTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}

export function parseEnvironment(source: NodeJS.ProcessEnv): AppConfig {
    const environment = readEnvironment(source.ENV);

    if (environment !== "TESTING") {
        const missing = REQUIRED_EXTERNAL_VARIABLES.filter((name) => !source[name]?.trim());

        if (missing.length > 0) {
            throw new ConfigurationError(`Missing required environment variables: ${missing.join(", ")}`);
        }
    }

    const port = readPort(source.PORT);
    const redirectUri = withoutTrailingSlash(
        source.REDIRECT_URI?.trim() || `http://localhost:${port}`,
    );

    return {
        environment,
        port,
        clientId: source.CLIENT_ID?.trim() ?? "",
        clientSecret: source.CLIENT_SECRET?.trim() ?? "",
        redirectUri,
        callbackUrl: `${redirectUri}/api/callback`,
        salesforceApiVersion: source.API_SF_VERSION?.trim() || "58.0",
        mongoUrl: source.MONGO?.trim() || "mongodb://127.0.0.1:27017/sfstudio-testing",
    };
}

export const config = parseEnvironment(process.env);

export const PORT = config.port;
export const CLIENT_ID = config.clientId;
export const CLIENT_SECRET = config.clientSecret;
export const ENV = config.environment;
export const REDIRECT_URI = config.redirectUri;
export const CALLBACK_URL = config.callbackUrl;
export const API_SF_VERSION = config.salesforceApiVersion;
export const MONGO_URL = config.mongoUrl;
