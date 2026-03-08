// Shared constants for countries and currencies
export const currencies = [
  "EUR", "USD", "GBP", "PLN", "TRY", "INR", "PHP", "UAH", "CAD", "AUD",
  "BBD", "TTD", "JMD", "BSD", "XCD", "AWG", "BZD", "GYD", "HTG", "KYD",
  "ANG", "DOP", "CUP", "SRD", "BMD",
];

export const countries = [
  // North America
  "United States",
  "Canada",
  // Europe
  "United Kingdom",
  "Germany",
  "France",
  "Poland",
  "Ukraine",
  "Ireland",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Portugal",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Austria",
  // Asia
  "Turkey",
  "India",
  "Philippines",
  "China",
  "Japan",
  "South Korea",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Vietnam",
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Nepal",
  // Caribbean
  "Antigua and Barbuda",
  "Bahamas",
  "Barbados",
  "Trinidad and Tobago",
  "Jamaica",
  "Haiti",
  "Dominican Republic",
  "Cuba",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Grenada",
  "Dominica",
  "Saint Kitts and Nevis",
  "Cayman Islands",
  "Turks and Caicos Islands",
  "British Virgin Islands",
  "U.S. Virgin Islands",
  "Aruba",
  "Curaçao",
  "Sint Maarten",
  "Bonaire",
  "Anguilla",
  "Montserrat",
  "Bermuda",
  "Puerto Rico",
  // Central America
  "Belize",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  // South America
  "Guyana",
  "Suriname",
  "Brazil",
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Peru",
  "Chile",
  "Argentina",
  "Mexico",
  // Pacific
  "Guam",
  "Fiji",
  "Samoa",
  // Africa
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Cameroon",
  "Senegal",
  // Oceania
  "Australia",
  "New Zealand",
].sort();

// Mock exchange rates (fallback to 1 for missing pairs)
export const rates: Record<string, Record<string, number>> = {
  EUR: { USD: 1.08, GBP: 0.86, PLN: 4.32, TRY: 32.1, INR: 90.2, PHP: 61.5, UAH: 40.2, EUR: 1, CAD: 1.47, AUD: 1.65, BBD: 2.16, TTD: 7.32, JMD: 167.5, BSD: 1.08, XCD: 2.92, AWG: 1.94, BZD: 2.17, GYD: 225.7, HTG: 143.2, KYD: 0.90, ANG: 1.94, DOP: 63.5, CUP: 25.9, SRD: 39.2, BMD: 1.08 },
  USD: { EUR: 0.93, GBP: 0.79, PLN: 4.0, TRY: 29.7, INR: 83.5, PHP: 56.9, UAH: 37.2, USD: 1, CAD: 1.36, AUD: 1.53, BBD: 2.0, TTD: 6.78, JMD: 155.1, BSD: 1.0, XCD: 2.70, AWG: 1.80, BZD: 2.01, GYD: 209.0, HTG: 132.6, KYD: 0.83, ANG: 1.80, DOP: 58.8, CUP: 24.0, SRD: 36.3, BMD: 1.0 },
  GBP: { EUR: 1.16, USD: 1.26, PLN: 5.02, TRY: 37.3, INR: 105.0, PHP: 71.8, UAH: 46.8, GBP: 1, CAD: 1.71, AUD: 1.94, BBD: 2.52, TTD: 8.55, JMD: 195.4, BSD: 1.26, XCD: 3.40, AWG: 2.27, BZD: 2.53, GYD: 263.3, HTG: 167.1, KYD: 1.05, ANG: 2.27, DOP: 74.1, CUP: 30.2, SRD: 45.8, BMD: 1.26 },
};

export const getExchangeRate = (from: string, to: string): number => {
  return rates[from]?.[to] ?? 1;
};
