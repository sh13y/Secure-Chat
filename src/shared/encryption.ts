import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits

  private static generateKey(senderId: string, receiverId: string): string {
    // Create a deterministic key based on both user IDs
    const combined = [senderId, receiverId].sort().join(':');
    const hash = CryptoJS.SHA256(combined);
    return hash.toString().slice(0, this.KEY_LENGTH);
  }

  private static generateIV(timestamp: number): string {
    // Generate a unique IV for each message using timestamp
    const iv = CryptoJS.SHA256(timestamp.toString());
    return iv.toString().slice(0, this.IV_LENGTH);
  }

  public static encryptMessage(
    message: string,
    senderId: string,
    receiverId: string
  ): string {
    try {
      const timestamp = Date.now();
      const key = this.generateKey(senderId, receiverId);
      const iv = this.generateIV(timestamp);

      // Encrypt the message
      const encrypted = CryptoJS.AES.encrypt(
        message,
        CryptoJS.enc.Utf8.parse(key),
        {
          iv: CryptoJS.enc.Utf8.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      // Combine IV and encrypted message
      return JSON.stringify({
        iv,
        content: encrypted.toString(),
        timestamp
      });
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  public static decryptMessage(
    encryptedData: string,
    senderId: string,
    receiverId: string
  ): string {
    try {
      const { iv, content, timestamp } = JSON.parse(encryptedData);
      const key = this.generateKey(senderId, receiverId);

      // Decrypt the message
      const decrypted = CryptoJS.AES.decrypt(
        content,
        CryptoJS.enc.Utf8.parse(key),
        {
          iv: CryptoJS.enc.Utf8.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted Message]';
    }
  }
}