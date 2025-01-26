import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const encryptionKey:String  = process.env.ENCRYPTION_KEY || "NULL"; // Must be 32 bytes
const ivLength = 16;

export function encrypt(text: string) {
  if (encryptionKey === "NULL") {
    throw new Error('Encryption key is not set');
  }
  let iv = crypto.randomBytes(ivLength);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
  if (encryptionKey === "NULL") {
        throw new Error('Encryption key is not set');
  }
  let parts = text.split(':');
  let ivPart = parts.shift();
  if (!ivPart) {
    throw new Error('Invalid encrypted text format');
  }
  let iv = Buffer.from(ivPart, 'hex');
  let encryptedText = Buffer.from(parts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}