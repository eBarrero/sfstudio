
export const PORT = process.env.PORT || 3000;
export const CLIENT_ID= process.env.CLIENT_ID || '';
export const CLIENTE_SECRET = process.env.CLIENT_SECRET || '';
export const ENV= process.env.ENV || 'NODEV';
export const REDIRECT_URI= process.env.REDIRECT_URI!;
export const CALLBACK_URL= ((ENV==="DEV")? "http://Localhost:3000": REDIRECT_URI) + "/api/callback";
export const API_SF_VERSION= process.env.API_SF_VERSION || '58.0';