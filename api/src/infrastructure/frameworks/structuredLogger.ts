export type LogLevel = "info" | "warn" | "error";

export interface LogSink {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

type LogContext = Record<string, unknown>;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /authorization|cookie|code|email|nonce|password|secret|state|token|username|authorizationUrl/i;
const SENSITIVE_TEXT = [
    /https?:\/\/[^\s"']*(?:authorize|oauth)[^\s"']*/gi,
    /([?&](?:code|state|access_token|refresh_token|client_secret)=)[^&\s]*/gi,
    /(bearer\s+)[a-z0-9._~+/=-]+/gi,
    /((?:cookie|client_secret|access_token|refresh_token)\s*[:=]\s*)[^\s,;]+/gi,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
];

function redactText(value: string): string {
    return SENSITIVE_TEXT.reduce(
        (redacted, pattern) => redacted.replace(pattern, `$1${REDACTED}`),
        value,
    );
}

function redact(value: unknown, key = "", seen = new WeakSet<object>()): unknown {
    if (SENSITIVE_KEY.test(key)) {
        return REDACTED;
    }

    if (typeof value === "string") {
        return redactText(value);
    }

    if (value === null || typeof value !== "object") {
        return value;
    }

    if (seen.has(value)) {
        return "[CIRCULAR]";
    }
    seen.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => redact(item, "", seen));
    }

    return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
            entryKey,
            redact(entryValue, entryKey, seen),
        ]),
    );
}

export class StructuredLogger {
    constructor(
        private readonly sink: LogSink = console,
        private readonly now: () => Date = () => new Date(),
    ) {}

    public info(event: string, context: LogContext = {}): void {
        this.write("info", event, context);
    }

    public warn(event: string, context: LogContext = {}): void {
        this.write("warn", event, context);
    }

    public error(event: string, context: LogContext = {}): void {
        this.write("error", event, context);
    }

    private write(level: LogLevel, event: string, context: LogContext): void {
        const safeContext = redact(context) as LogContext;
        const entry = {
            timestamp: this.now().toISOString(),
            level,
            event,
            ...safeContext,
        };
        const serialized = JSON.stringify(entry);

        if (level === "error") {
            this.sink.error(serialized);
        } else if (level === "warn") {
            this.sink.warn(serialized);
        } else {
            this.sink.log(serialized);
        }
    }
}

export const logger = new StructuredLogger();
