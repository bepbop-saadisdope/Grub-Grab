// Pakistani mobile format: exactly 11 digits starting with 0
// (e.g. 03001234567). No country code, no separators.
const PAKISTANI_PHONE_RE = /^0\d{10}$/;

export const PHONE_PLACEHOLDER = '03001234567';
export const PHONE_MAX_LENGTH = 11;
export const PHONE_ERROR =
  'Phone must be 11 digits starting with 0 (e.g. 03001234567).';

export const isValidPakistaniPhone = (raw) =>
  PAKISTANI_PHONE_RE.test(String(raw ?? '').trim());
