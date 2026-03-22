/**
 * Normalizes a phone number to the international format.
 * Currently defaults to Ecuador (+593) if no country code is present.
 */
export const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove all non-digit characters
    let clean = phone.replace(/\D/g, '');

    // If it already starts with a potential country code (e.g., 593), make sure it has the plus
    // This is a bit naive but covers the most common case for this app
    if (clean.length > 10 && (clean.startsWith('593') || clean.startsWith('1'))) {
        return `+${clean}`;
    }

    // If it's a local Ecuador number (9 or 10 digits starting with 0 or 9)
    if (clean.length >= 9 && clean.length <= 10) {
        if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }
        return `+593${clean}`;
    }

    // Default: just add the plus if it had digits but was short/long
    return clean ? `+${clean}` : '';
};

