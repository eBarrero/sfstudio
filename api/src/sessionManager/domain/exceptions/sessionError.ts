
enum ErrorType {
    SESSION_INVALID = 401
}

export enum ErrorMessages {
    SESSION_INVALID = "Session expired or invalid",
}    

export class SessionError extends Error {
    errorNumber: ErrorType = ErrorType.SESSION_INVALID;
    stack = "No stack trace available";
    constructor(message: string) {
        super(message);
        this.name = "SessionError";
    }
    getErrorNumber(): number {  return this.errorNumber; }  
}
