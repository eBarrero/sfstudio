class RequestError extends Error {
    status: number;  
    statusText: string;
    constructor(response: Response, message: string) {
      super(message);
      this.status = response.status;
      this.statusText = response.statusText;  
      this.name = "RequestError";
      Object.setPrototypeOf(this, RequestError.prototype);
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sfstudio:reauth-required'));
      }
    }
  }

  export default RequestError;
