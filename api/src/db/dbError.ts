export default class dbError extends Error {
    errorNumber: number = 500;
    stack = "No stack trace available";
    constructor(message: string) {
        super(message);
        this.name = "dbError";
        console.error(`[${this.name}]: [${this.message}]`);
    }
    getErrorNumber(): number {  return this.errorNumber; }  
}