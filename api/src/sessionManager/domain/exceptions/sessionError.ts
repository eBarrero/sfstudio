
enum ErrorType {
    SESSION_EXPIRED = 401,
    SESSION_INVALID = 500
}

export enum ErrorMessages {
    USER_NOT_FOUND = "User not found",
}    

export class SessionError extends Error {
    errorNumber: ErrorType = ErrorType.SESSION_INVALID;
    stack = "No stack trace available";
    constructor(message: string) {
        super(message);
        this.name = "SessionError";
        if (message.includes("Session expired or invalid")) this.errorNumber = ErrorType.SESSION_EXPIRED;
        console.error(`[${this.name}]: [${this.message}]`);
    }
    getErrorNumber(): number {  return this.errorNumber; }  
}