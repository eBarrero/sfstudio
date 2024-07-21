class RequestError extends Error {
    status: number;  
    statusText: string;
    constructor(response: Response, message: string) {
      super(message);
      this.status = response.status;
      this.statusText = response.statusText;  
      this.name = "RequestError";
      Object.setPrototypeOf(this, RequestError.prototype);
    }
  }

  export default RequestError;