// Pakistani CNIC: 13 digits in the format XXXXX-XXXXXXX-X.
const CNIC_RE = /^\d{5}-\d{7}-\d$/;

export const CNIC_PLACEHOLDER = '35201-1234567-1';
export const CNIC_MAX_LENGTH = 15; // 13 digits + 2 dashes
export const CNIC_ERROR = 'CNIC must be in the format XXXXX-XXXXXXX-X.';

export const isValidCnic = (raw) =>
  CNIC_RE.test(String(raw ?? '').trim());

// Auto-insert dashes as the user types: 1234567890123 → 12345-6789012-3
export const formatCnicAsType = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};
