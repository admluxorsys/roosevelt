
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Objeto mejorado para mapear códigos de país a su información
export const countryData = {
  '1': { flag: '🇺🇸', code: 'US' },
  '44': { flag: '🇬🇧', code: 'GB' },
  '54': { flag: '🇦🇷', code: 'AR' },
  '55': { flag: '🇧🇷', code: 'BR' },
  '52': { flag: '🇲🇽', code: 'MX' },
  '34': { flag: '🇪🇸', code: 'ES' },
  '57': { flag: '🇨🇴', code: 'CO' },
  '56': { flag: '🇨🇱', code: 'CL' },
  '51': { flag: '🇵🇪', code: 'PE' },
  '58': { flag: '🇻🇪', code: 'VE' },
  '591': { flag: '🇧🇴', code: 'BO' },
  '593': { flag: '🇪🇨', code: 'EC' },
  '595': { flag: '🇵🇾', code: 'PY' },
  '598': { flag: '🇺🇾', code: 'UY' },
  '506': { flag: '🇨🇷', code: 'CR' },
  '507': { flag: '🇵🇦', code: 'PA' },
  '502': { flag: '🇬🇹', code: 'GT' },
  '503': { flag: '🇸🇻', code: 'SV' },
  '504': { flag: '🇭🇳', code: 'HN' },
  '505': { flag: '🇳🇮', code: 'NI' },
  '1809': '🇩🇴', // Dominican Republic (Legacy, combined with 1)
  '1829': '🇩🇴', // Dominican Republic (Legacy, combined with 1)
  '1849': '🇩🇴', // Dominican Republic (Legacy, combined with 1)
  '53': { flag: '🇨🇺', code: 'CU' },
  '1787': '🇵🇷', // Puerto Rico (Legacy, combined with 1)
  '1939': '🇵🇷', // Puerto Rico (Legacy, combined with 1)
  '33': { flag: '🇫🇷', code: 'FR' },
  '49': { flag: '🇩🇪', code: 'DE' },
  '39': { flag: '🇮🇹', code: 'IT' },
  '351': { flag: '🇵🇹', code: 'PT' },
};

// Se mantiene la exportación anterior por si se usa en otro sitio, aunque se debería migrar a countryData
export const countryCodeToFlag = Object.fromEntries(
  Object.entries(countryData).map(([code, data]) => [code, typeof data === 'string' ? data : data.flag])
);

export function formatPhoneNumber(phone: string | undefined | null) {
  if (!phone) return '—';

  const cleanPhone = phone.replace(/\D/g, ''); // Remove all non-numeric chars

  // Sort prefixes by length (descending) so we match '1809' before '1'
  const sortedPrefixes = Object.keys(countryData).sort((a, b) => b.length - a.length);

  for (const prefix of sortedPrefixes) {
    if (cleanPhone.startsWith(prefix)) {
      const data = countryData[prefix as keyof typeof countryData];
      const flag = typeof data === 'string' ? data : data.flag; // Handle legacy string format if any
      const rest = cleanPhone.slice(prefix.length);

      // Basic formatting: XXX XXX XXXX or XX XXX XXXX depending on length
      // Use a simple block format for readability
      let formattedRest = rest;
      if (rest.length > 6) {
        formattedRest = `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
      } else if (rest.length > 3) {
        formattedRest = `${rest.slice(0, 3)} ${rest.slice(3)}`;
      }

      return `${flag} +${prefix} ${formattedRest}`;
    }
  }

  // If no prefix matches, return as is (or maybe with some generic spacing)
  return cleanPhone;
}

