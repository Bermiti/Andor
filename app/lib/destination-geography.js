const UNITED_KINGDOM = 'United Kingdom';
const UNITED_KINGDOM_CODE = 'GB';
const UNITED_KINGDOM_NUMERIC_CODE = '826';

const UK_COUNTRY_ALIASES = new Set([
  'gb',
  'great britain',
  'u.k.',
  'uk',
  'united kingdom',
]);

const SCOTLAND_ALIASES = new Set(['scotland']);
const SCOTTISH_CITIES = new Map([
  ['edinburgh', 'Edinburgh'],
  ['glasgow', 'Glasgow'],
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function lookupKey(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isUkCountry(value) {
  return UK_COUNTRY_ALIASES.has(lookupKey(value));
}

function isScotland(value) {
  return SCOTLAND_ALIASES.has(lookupKey(value));
}

function uniqueLabel(parts) {
  const seen = new Set();
  return parts
    .map(cleanText)
    .filter(Boolean)
    .filter((part) => {
      const key = lookupKey(part);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

/**
 * Normalizes the small UK hierarchy that Andor currently needs without
 * pretending to provide a complete offline gazetteer. Unknown destinations
 * return null and continue through the existing provider-backed flow.
 */
export function normalizeUnitedKingdomDestination(value) {
  const isObject = Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const source = isObject ? { ...value } : {};
  const inputLabel = isObject ? cleanText(source.name) : cleanText(value);

  let city = cleanText(source.city);
  let region = cleanText(source.region || source.state);
  let country = cleanText(source.country);

  if (isScotland(country)) {
    region = region || 'Scotland';
    country = '';
  }

  if (isScotland(city) && !region) {
    region = 'Scotland';
    city = '';
  }

  const labelParts = inputLabel
    ? inputLabel.split(',').map((part) => part.trim()).filter(Boolean)
    : [];
  const unmatchedParts = [];

  for (const part of labelParts) {
    if (isScotland(part)) {
      region = region || 'Scotland';
    } else if (isUkCountry(part)) {
      country = UNITED_KINGDOM;
    } else {
      unmatchedParts.push(part);
    }
  }

  if (!city && unmatchedParts.length > 0) {
    city = unmatchedParts[0];
  }
  if (!country && unmatchedParts.length > 1) {
    country = unmatchedParts.at(-1);
  }

  const canonicalScottishCity = SCOTTISH_CITIES.get(lookupKey(city));
  if (canonicalScottishCity) {
    city = canonicalScottishCity;
    region = region || 'Scotland';
  }
  if (isScotland(region)) {
    region = 'Scotland';
  }

  const hasUkCountry = isUkCountry(country);
  const hasScottishHierarchy = region === 'Scotland';
  const hasExplicitForeignCountry = Boolean(country) && !hasUkCountry;

  if ((!hasUkCountry && !hasScottishHierarchy) || hasExplicitForeignCountry) {
    return null;
  }

  country = UNITED_KINGDOM;
  const canonicalName = uniqueLabel([city, region, country]);

  return {
    ...source,
    name: isObject && inputLabel ? inputLabel : canonicalName,
    city,
    region,
    country,
    countryCode: UNITED_KINGDOM_CODE,
    flag: source.flag || UNITED_KINGDOM_CODE,
    timezone: 'Europe/London',
    currency: { code: 'GBP', symbol: 'GBP' },
  };
}

export function getUnitedKingdomNumericCode(value) {
  return normalizeUnitedKingdomDestination(value)
    ? UNITED_KINGDOM_NUMERIC_CODE
    : null;
}
