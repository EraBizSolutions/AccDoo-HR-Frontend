const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const scriptTags = /<\s*\/?\s*script\b/i;
const suspiciousSql = /(--|\/\*|\*\/|\b(drop|truncate|alter|union\s+select|or\s+1\s*=\s*1|xp_)\b)/i;

export const safeNameRegex = /^[A-Za-z][A-Za-z .'-]*$/;
export const safeTextRegex = /^[A-Za-z0-9][A-Za-z0-9 ,.'/#()&+-]*$/;
export const safeSimpleTextRegex = /^[A-Za-z0-9][A-Za-z0-9 .'-]*$/;
export const safeCodeRegex = /^[A-Za-z0-9-]+$/;
export const digitsRegex = /^[0-9]+$/;

export function normalizeText(value) {
  return typeof value === "string" ? value.replace(/\s{2,}/g, " ").trimStart() : value;
}

export function hasUnsafeInput(value) {
  if (!value) return false;
  return controlCharacters.test(value) || scriptTags.test(value) || suspiciousSql.test(value);
}

export function sanitizeSafeName(value) {
  return normalizeText(value.replace(/[^A-Za-z .'-]/g, ""));
}

export function sanitizeSafeText(value, maxLength = 500) {
  return normalizeText(value.replace(/[^A-Za-z0-9 ,.'/#()&+-]/g, "")).slice(0, maxLength);
}

export function sanitizeSafeCode(value, maxLength = 80) {
  return value.replace(/[^A-Za-z0-9-]/g, "").slice(0, maxLength).toUpperCase();
}

export function validateValue(errors, name, value, options = {}) {
  const {
    required = false,
    regex,
    message = "Please enter a valid value.",
    maxLength,
  } = options;
  const trimmed = typeof value === "string" ? value.trim() : value;

  if (required && !trimmed) {
    errors[name] = "This field is required.";
    return;
  }

  if (!trimmed) return;

  if (maxLength && String(trimmed).length > maxLength) {
    errors[name] = "This value is too long.";
    return;
  }

  if (hasUnsafeInput(String(trimmed))) {
    errors[name] = "This field contains unsupported characters.";
    return;
  }

  if (regex && !regex.test(String(trimmed))) {
    errors[name] = message;
  }
}

export function getApiErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error.message === "string") return error.message;
  return fallback;
}
