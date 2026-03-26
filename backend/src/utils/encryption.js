import CryptoJS from 'crypto-js';
import { config } from '../config/index.js';

const KEY = config.encryption.key;

export function encrypt(plainText) {
  return CryptoJS.AES.encrypt(plainText, KEY).toString();
}

export function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}