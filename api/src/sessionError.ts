export class SessionError extends Error {
    errorNumber: number = 500;
    stack = "No stack trace available";
    constructor(message: string) {
        super(message);
        this.name = "SessionError";
        if (message.includes("Session expired or invalid")) this.errorNumber = 401;
        console.error(`[${this.name}]: [${this.message}]`);
    }
    getErrorNumber(): number {  return this.errorNumber; }  
}
