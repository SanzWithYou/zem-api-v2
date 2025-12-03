// Data negara yang didukung
const SUPPORTED_COUNTRIES = {
  id: {
    name: 'Indonesia',
    code: 'id',
    phoneCode: '62',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    whatsappFormat: 'Contoh: 08123456789',
    flag: '🇮🇩',
    weight: 3, // Bobot untuk Indonesia (target pasar utama)
  },
  my: {
    name: 'Malaysia',
    code: 'my',
    phoneCode: '60',
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur',
    whatsappFormat: 'Contoh: 123456789',
    flag: '🇲🇾',
    weight: 2,
  },
  sg: {
    name: 'Singapore',
    code: 'sg',
    phoneCode: '65',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    whatsappFormat: 'Contoh: 91234567',
    flag: '🇸🇬',
    weight: 2,
  },
  us: {
    name: 'United States',
    code: 'us',
    phoneCode: '1',
    currency: 'USD',
    timezone: 'America/New_York',
    whatsappFormat: 'Contoh: 1234567890',
    flag: '🇺🇸',
    weight: 1,
  },
  gb: {
    name: 'United Kingdom',
    code: 'gb',
    phoneCode: '44',
    currency: 'GBP',
    timezone: 'Europe/London',
    whatsappFormat: 'Contoh: 7123456789',
    flag: '🇬🇧',
    weight: 1,
  },
  au: {
    name: 'Australia',
    code: 'au',
    phoneCode: '61',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    whatsappFormat: 'Contoh: 412345678',
    flag: '🇦🇺',
    weight: 1,
  },
  ca: {
    name: 'Canada',
    code: 'ca',
    phoneCode: '1',
    currency: 'CAD',
    timezone: 'America/Toronto',
    whatsappFormat: 'Contoh: 4123456789',
    flag: '🇨🇦',
    weight: 1,
  },
};

// Deteksi negara dari IP (menggunakan API ipapi.co)
const detectCountryFromIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Periksa apakah response memiliki properti country
    if (data && data.country) {
      return data.country.toLowerCase();
    }

    // Fallback: cek properti lain yang mungkin berisi kode negara
    if (data && data.country_code) {
      return data.country_code.toLowerCase();
    }

    // Jika tidak ada informasi negara, return null
    return null;
  } catch (error) {
    console.error('Error detecting country by IP:', error);
    return null;
  }
};

// Deteksi negara dari IP client
const detectCountryFromClientIP = async (req) => {
  try {
    // Dapatkan IP client dengan lebih baik
    let clientIP =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    // Jika x-forwarded-for berisi beberapa IP, ambil yang pertama
    if (clientIP && clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }

    // Jika IP adalah localhost atau private network, gunakan API tanpa parameter
    if (
      !clientIP ||
      clientIP === '::1' ||
      clientIP === '127.0.0.1' ||
      clientIP.startsWith('192.168.') ||
      clientIP.startsWith('10.') ||
      clientIP.startsWith('172.')
    ) {
      return await detectCountryFromIP();
    }

    // Untuk IP client, gunakan API dengan parameter IP
    const response = await fetch(`https://ipapi.co/${clientIP}/json/`);
    const data = await response.json();

    // Periksa apakah response memiliki properti country
    if (data && data.country) {
      return data.country.toLowerCase();
    }

    // Fallback: cek properti lain yang mungkin berisi kode negara
    if (data && data.country_code) {
      return data.country_code.toLowerCase();
    }

    // Jika tidak ada informasi negara, return null
    return null;
  } catch (error) {
    console.error('Error detecting country from client IP:', error);
    return null;
  }
};

// Get country info by code
const getCountryInfo = (countryCode) => {
  return SUPPORTED_COUNTRIES[countryCode] || SUPPORTED_COUNTRIES.id;
};

// Format waktu
const formatTimestamp = (timestamp, countryCode = 'id') => {
  const countryInfo = getCountryInfo(countryCode);
  const moment = require('moment-timezone');
  return moment(timestamp)
    .tz(countryInfo.timezone)
    .format('DD/MM/YYYY HH:mm:ss');
};

module.exports = {
  detectCountryFromIP,
  detectCountryFromClientIP,
  getCountryInfo,
  formatTimestamp,
  SUPPORTED_COUNTRIES,
};
