export function safeParse(jsonStr, defaultValue = null) {
  if (typeof jsonStr !== 'string') return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return defaultValue;
  }
}

export function safeStringify(obj, defaultValue = '') {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return defaultValue;
  }
}
