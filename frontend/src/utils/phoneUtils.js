/**
 * Phone Number Utilities for WeatherGPT
 * Supports validation, normalization, and masking for Indian (+91) and international (E.164) phone numbers.
 */

/**
 * Validates whether the given string is a valid Indian mobile number.
 * Accepts formats: 9876543210, +919876543210, 919876543210, 09876543210, +91 98765 43210, etc.
 * @param {string} phone 
 * @returns {boolean}
 */
export function validateIndianPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  const clean = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  // 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(clean)) return true;
  
  // 11 digits starting with 0, followed by 6-9
  if (/^0[6-9]\d{9}$/.test(clean)) return true;

  // 12 digits starting with 91, followed by 6-9
  if (/^91[6-9]\d{9}$/.test(clean)) return true;

  // Standard +91 format
  if (/^\+91[6-9]\d{9}$/.test(clean)) return true;

  return false;
}

/**
 * Validates any phone number (Indian or International E.164 format).
 * @param {string} phone 
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { isValid: false, error: 'Phone number cannot be empty.' };
  }

  const clean = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Check Indian format
  if (validateIndianPhoneNumber(clean)) {
    return { isValid: true };
  }

  // Check International E.164 format: + followed by 7 to 15 digits
  if (/^\+[1-9]\d{6,14}$/.test(clean)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Please enter a valid phone number with country code (e.g. +919876543210 or +14155552671).'
  };
}

/**
 * Normalizes phone number to standard E.164 format.
 * For India, normalizes to +91XXXXXXXXXX format.
 * @param {string} phone 
 * @returns {string|null} normalized phone string or null if invalid
 */
export function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return null;

  const clean = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Handle Indian phone normalization
  if (validateIndianPhoneNumber(clean)) {
    const digitsOnly = clean.replace(/\+/g, '');
    let coreDigits = '';
    if (digitsOnly.length === 10) {
      coreDigits = digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      coreDigits = digitsOnly.slice(1);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      coreDigits = digitsOnly.slice(2);
    }
    return `+91${coreDigits}`;
  }

  // Handle International E.164 format
  if (/^\+[1-9]\d{6,14}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Masks standard phone number for secure UI display.
 * Example: +919876543210 -> +91******3210
 * Example: +14155552671 -> +1******2671
 * @param {string} phone 
 * @returns {string}
 */
export function maskPhoneNumber(phone) {
  if (!phone) return '';
  const formatted = formatPhoneNumber(phone) || phone.trim();
  
  if (formatted.startsWith('+91') && formatted.length === 13) {
    const last4 = formatted.slice(-4);
    return `+91******${last4}`;
  }
  
  if (formatted.startsWith('+') && formatted.length >= 8) {
    const last4 = formatted.slice(-4);
    const countryCodeLength = formatted.length > 11 ? 3 : 2;
    const prefix = formatted.slice(0, countryCodeLength);
    return `${prefix}******${last4}`;
  }

  if (formatted.length >= 10) {
    const last4 = formatted.slice(-4);
    return `+91******${last4}`;
  }

  return formatted;
}

