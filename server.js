const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const ROOT = __dirname;

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const CENTERS_PATH = path.join(ROOT, 'data', 'centers.json');
const OTP_TTL_MS = 10 * 60 * 1000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vital-veins';
const OVERPASS_API_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

const otpStore = new Map();
const centers = JSON.parse(fs.readFileSync(CENTERS_PATH, 'utf8'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    verifiedAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const donationAppointmentSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    donorName: { type: String, required: true, trim: true },
    donorBloodGroup: { type: String, required: true },
    centerId: { type: String, required: true, trim: true },
    centerName: { type: String, required: true, trim: true },
    centerType: { type: String, required: true, trim: true },
    centerAddress: { type: String, required: true, trim: true },
    centerPhone: { type: String, default: 'Contact not listed', trim: true },
    centerMaps: { type: String, default: '', trim: true },
    appointmentAt: { type: Date, required: true },
    eligibility: {
      age: { type: Number, required: true },
      smokeStatus: { type: String, required: true },
      drinkStatus: { type: String, required: true },
      donatedBefore: { type: String, required: true },
      lastDonationDate: { type: Date, default: null },
      aadharLast4: { type: String, required: true },
    },
    status: { type: String, enum: ['booked', 'completed'], default: 'booked' },
    certificateCode: { type: String, default: null },
    certificateIssuedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const DonationAppointment =
  mongoose.models.DonationAppointment || mongoose.model('DonationAppointment', donationAppointmentSchema);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, {});
    }

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === '/api/auth/request-signup-otp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleRequestSignupOtp(body, res);
    }

    if (url.pathname === '/api/auth/verify-signup-otp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleVerifySignupOtp(body, res);
    }

    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleLogin(body, res);
    }

    if (url.pathname === '/api/users/by-email' && req.method === 'GET') {
      return handleUserByEmail(url.searchParams, res);
    }

    if (url.pathname === '/api/centers/nearby' && req.method === 'GET') {
      return handleNearbyCenters(url.searchParams, res);
    }

    if (url.pathname === '/api/donation-centers/live' && req.method === 'GET') {
      return handleLiveDonationCenters(url.searchParams, res);
    }

    if (url.pathname === '/api/donations/book' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleBookDonation(body, res);
    }

    if (url.pathname === '/api/donations/by-email' && req.method === 'GET') {
      return handleDonationByEmail(url.searchParams, res);
    }

    if (url.pathname === '/api/donations/confirm' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return handleConfirmDonation(body, res);
    }

    if (req.method === 'GET') {
      return serveStatic(url.pathname, res);
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, '$1');
    if (!process.env[key]) process.env[key] = value;
  }
}

async function startServer() {
  await mongoose.connect(MONGODB_URI);
  server.listen(PORT, () => {
    console.log(`Vital Veins server running at http://localhost:${PORT}`);
  });
}

function sanitizeUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    bloodGroup: user.bloodGroup,
    location: user.location,
    verifiedAt:
      user.verifiedAt instanceof Date ? user.verifiedAt.toISOString() : user.verifiedAt,
  };
}

async function handleRequestSignupOtp(body, res) {
  const { name, email, password, bloodGroup, location } = body || {};
  if (!name || !email || !password || !bloodGroup || !location) {
    return sendJson(res, 400, { error: 'All signup fields are required.' });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
  }

  const existingUser = await User.exists({ email: email.toLowerCase() });
  if (existingUser) {
    return sendJson(res, 409, { error: 'This email is already registered.' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    payload: {
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      bloodGroup,
      location: location.trim(),
    },
  });

  await sendOtpEmail(email.toLowerCase(), otp, name.trim());
  sendJson(res, 200, { message: 'OTP sent successfully.' });
}

async function handleVerifySignupOtp(body, res) {
  const { email, otp } = body || {};
  if (!email || !otp) {
    return sendJson(res, 400, { error: 'Email and OTP are required.' });
  }

  const pending = otpStore.get(email.toLowerCase());
  if (!pending) {
    return sendJson(res, 400, { error: 'No OTP request found for this email.' });
  }
  if (pending.expiresAt < Date.now()) {
    otpStore.delete(email.toLowerCase());
    return sendJson(res, 400, { error: 'OTP expired. Please request a new OTP.' });
  }
  if (pending.otp !== String(otp).trim()) {
    return sendJson(res, 400, { error: 'Invalid OTP.' });
  }

  const existingUser = await User.exists({ email: email.toLowerCase() });
  if (existingUser) {
    otpStore.delete(email.toLowerCase());
    return sendJson(res, 409, { error: 'This email is already registered.' });
  }

  const user = await User.create({
    ...pending.payload,
    verifiedAt: new Date(),
  });
  otpStore.delete(email.toLowerCase());
  sendJson(res, 201, { user: sanitizeUser(user) });
}

async function handleLogin(body, res) {
  const { email, password } = body || {};
  if (!email || !password) {
    return sendJson(res, 400, { error: 'Email and password are required.' });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user || user.passwordHash !== hashPassword(password)) {
    return sendJson(res, 401, { error: 'Invalid email or password.' });
  }
  sendJson(res, 200, { user: sanitizeUser(user) });
}

async function handleUserByEmail(searchParams, res) {
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  if (!email) {
    return sendJson(res, 400, { error: 'Email is required.' });
  }
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return sendJson(res, 404, { error: 'User not found.' });
  }
  sendJson(res, 200, { user: sanitizeUser(user) });
}

async function handleNearbyCenters(searchParams, res) {
  const bloodType = (searchParams.get('bloodType') || '').trim();
  const location = (searchParams.get('location') || '').trim();
  const mode = (searchParams.get('mode') || 'need').trim();
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  let origin = null;
  if (latParam && lngParam) {
    origin = { lat: Number(latParam), lng: Number(lngParam), source: 'browser' };
  }

  const bloodTypeMatches =
    mode === 'donate' ? centers.filter((center) => acceptsDonors(center)) : centers.filter((center) => matchesBloodType(center, bloodType));
  let filtered = bloodTypeMatches
    .filter((center) => matchesLocation(center, location))
    .map((center) => {
      const distanceKm = origin ? haversineKm(origin.lat, origin.lng, center.lat, center.lng) : null;
      return {
        ...center,
        distanceKm,
        distance: distanceKm === null ? 'Nearby' : `${distanceKm.toFixed(1)} km`,
        maps: toOpenStreetMapSearch(center),
      };
    });

  let locationFilterRelaxed = false;
  if (!filtered.length && location) {
    filtered = bloodTypeMatches.map((center) => {
      const distanceKm = origin ? haversineKm(origin.lat, origin.lng, center.lat, center.lng) : null;
      return {
        ...center,
        distanceKm,
        distance: distanceKm === null ? 'Nearby' : `${distanceKm.toFixed(1)} km`,
        maps: toOpenStreetMapSearch(center),
      };
    });
    locationFilterRelaxed = true;
  }

  filtered.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      if (mode === 'donate') {
        const priorityDifference = donateCenterPriority(b) - donateCenterPriority(a);
        if (priorityDifference !== 0) return priorityDifference;
      }
      return b.rating - a.rating;
    }
    if (mode === 'donate') return donateScore(b) - donateScore(a);
    if (a.distanceKm === null && b.distanceKm === null) return b.rating - a.rating;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return b.rating - a.rating;
  });

  sendJson(res, 200, {
    centers: filtered,
    origin: origin ? { lat: origin.lat, lng: origin.lng, source: origin.source } : null,
    locationFilterRelaxed,
  });
}

async function handleLiveDonationCenters(searchParams, res) {
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const radiusKm = Math.min(Number(searchParams.get('radiusKm')) || 30, 75);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: 'Valid latitude and longitude are required.' });
  }

  try {
    const centers = await fetchLiveDonationCenters(lat, lng, radiusKm);
    sendJson(res, 200, {
      centers,
      source: 'openstreetmap',
      origin: { lat, lng, source: 'browser' },
    });
  } catch (error) {
    console.error('Live donation center lookup failed:', error);
    sendJson(res, 502, { error: 'Unable to fetch live donation centers right now.' });
  }
}

async function handleBookDonation(body, res) {
  const {
    userEmail,
    donorAge,
    smokeStatus,
    drinkStatus,
    donatedBefore,
    lastDonationDate,
    aadharNumber,
    center,
  } = body || {};

  if (!userEmail || !center?.id || !center?.name || !center?.address) {
    return sendJson(res, 400, { error: 'User and center details are required to book an appointment.' });
  }

  const user = await User.findOne({ email: String(userEmail).toLowerCase() }).lean();
  if (!user) {
    return sendJson(res, 404, { error: 'User not found.' });
  }

  const existingAppointment = await DonationAppointment.findOne({
    userEmail: user.email,
    status: 'booked',
  }).sort({ appointmentAt: -1 });

  if (existingAppointment) {
    return sendJson(res, 409, {
      error: 'You already have a booked donation appointment.',
      appointment: sanitizeAppointment(existingAppointment),
    });
  }

  const appointmentAt = generateAppointmentTimeSlot();
  const appointment = await DonationAppointment.create({
    userEmail: user.email,
    donorName: user.name,
    donorBloodGroup: user.bloodGroup,
    centerId: String(center.id),
    centerName: center.name,
    centerType: center.type || 'Donation Center',
    centerAddress: center.address,
    centerPhone: center.phone || 'Contact not listed',
    centerMaps: center.maps || toOpenStreetMapSearch(center),
    appointmentAt,
    eligibility: {
      age: Number(donorAge),
      smokeStatus: String(smokeStatus),
      drinkStatus: String(drinkStatus),
      donatedBefore: String(donatedBefore),
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      aadharLast4: String(aadharNumber).slice(-4),
    },
  });

  sendJson(res, 201, {
    appointment: sanitizeAppointment(appointment),
  });
}

async function handleDonationByEmail(searchParams, res) {
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  if (!email) {
    return sendJson(res, 400, { error: 'Email is required.' });
  }

  const appointment = await DonationAppointment.findOne({ userEmail: email }).sort({ createdAt: -1 }).lean();
  sendJson(res, 200, {
    appointment: appointment ? sanitizeAppointment(appointment) : null,
  });
}

async function handleConfirmDonation(body, res) {
  const { appointmentId } = body || {};
  if (!appointmentId) {
    return sendJson(res, 400, { error: 'Appointment id is required.' });
  }

  const appointment = await DonationAppointment.findById(appointmentId);
  if (!appointment) {
    return sendJson(res, 404, { error: 'Appointment not found.' });
  }

  if (appointment.status === 'completed') {
    return sendJson(res, 200, { appointment: sanitizeAppointment(appointment) });
  }

  appointment.status = 'completed';
  appointment.completedAt = new Date();
  appointment.certificateIssuedAt = new Date();
  appointment.certificateCode = generateCertificateCode();
  await appointment.save();

  sendJson(res, 200, {
    appointment: sanitizeAppointment(appointment),
  });
}

function matchesBloodType(center, bloodType) {
  if (!bloodType) return true;
  return Number(center.stockByType[bloodType] || 0) > 0;
}

function acceptsDonors(center) {
  return center.type === 'Donation Center' || center.type === 'Hospital' || center.type === 'Blood Bank';
}

async function fetchLiveDonationCenters(lat, lng, radiusKm) {
  const radiusMeters = Math.max(5000, Math.round(radiusKm * 1000));
  const query = `
[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lng})["healthcare"="blood_donation"];
  way(around:${radiusMeters},${lat},${lng})["healthcare"="blood_donation"];
  relation(around:${radiusMeters},${lat},${lng})["healthcare"="blood_donation"];
  node(around:${radiusMeters},${lat},${lng})["amenity"="blood_bank"];
  way(around:${radiusMeters},${lat},${lng})["amenity"="blood_bank"];
  relation(around:${radiusMeters},${lat},${lng})["amenity"="blood_bank"];
  node(around:${radiusMeters},${lat},${lng})["healthcare"="blood_bank"];
  way(around:${radiusMeters},${lat},${lng})["healthcare"="blood_bank"];
  relation(around:${radiusMeters},${lat},${lng})["healthcare"="blood_bank"];
);
out center tags;
  `.trim();

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'User-Agent': 'VitalVeins/1.0',
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const data = await response.json();
  const normalized = (data.elements || [])
    .map((element) => normalizeLiveCenter(element, lat, lng))
    .filter(Boolean);

  const deduped = Array.from(new Map(normalized.map((center) => [center.id, center])).values());
  deduped.sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating);
  return deduped.slice(0, 12);
}

function normalizeLiveCenter(element, originLat, originLng) {
  const tags = element.tags || {};
  const centerLat = Number(element.lat ?? element.center?.lat);
  const centerLng = Number(element.lon ?? element.center?.lon);

  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return null;
  }

  const name = tags.name || tags.operator || 'Nearby donation center';
  const type = tags.healthcare === 'blood_donation'
    ? 'Donation Center'
    : tags.amenity === 'blood_bank' || tags.healthcare === 'blood_bank'
      ? 'Blood Bank'
      : 'Medical Center';
  const phone = tags.phone || tags['contact:phone'] || tags.mobile || 'Contact not listed';
  const address = formatLiveCenterAddress(tags);
  const distanceKm = haversineKm(originLat, originLng, centerLat, centerLng);

  return {
    id: `${element.type}-${element.id}`,
    name,
    address,
    location: tags['addr:city'] || tags['addr:town'] || tags['addr:state'] || 'Nearby area',
    phone,
    type,
    rating: inferLiveCenterRating(tags),
    reviewsCount: 0,
    reviewSnippets: [],
    stockByType: {},
    lat: centerLat,
    lng: centerLng,
    images: [],
    distanceKm,
    distance: `${distanceKm.toFixed(1)} km`,
    maps: toOpenStreetMapSearch({ lat: centerLat, lng: centerLng }),
  };
}

function formatLiveCenterAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:town'],
    tags['addr:state'],
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : tags['addr:full'] || 'Address not listed in map data';
}

function inferLiveCenterRating(tags) {
  if (tags.healthcare === 'blood_donation') return 4.8;
  if (tags.amenity === 'blood_bank' || tags.healthcare === 'blood_bank') return 4.6;
  return 4.4;
}

function sanitizeAppointment(appointment) {
  const item = appointment.toObject ? appointment.toObject() : appointment;
  return {
    id: String(item._id || item.id),
    userEmail: item.userEmail,
    donorName: item.donorName,
    donorBloodGroup: item.donorBloodGroup,
    centerId: item.centerId,
    centerName: item.centerName,
    centerType: item.centerType,
    centerAddress: item.centerAddress,
    centerPhone: item.centerPhone,
    centerMaps: item.centerMaps,
    appointmentAt: item.appointmentAt instanceof Date ? item.appointmentAt.toISOString() : item.appointmentAt,
    status: item.status,
    certificateCode: item.certificateCode,
    certificateIssuedAt:
      item.certificateIssuedAt instanceof Date ? item.certificateIssuedAt.toISOString() : item.certificateIssuedAt,
    completedAt: item.completedAt instanceof Date ? item.completedAt.toISOString() : item.completedAt,
    eligibility: {
      age: item.eligibility?.age,
      smokeStatus: item.eligibility?.smokeStatus,
      drinkStatus: item.eligibility?.drinkStatus,
      donatedBefore: item.eligibility?.donatedBefore,
      lastDonationDate:
        item.eligibility?.lastDonationDate instanceof Date
          ? item.eligibility.lastDonationDate.toISOString()
          : item.eligibility?.lastDonationDate || null,
      aadharLast4: item.eligibility?.aadharLast4,
    },
  };
}

function generateAppointmentTimeSlot() {
  const slot = new Date();
  slot.setMinutes(0, 0, 0);
  slot.setHours(slot.getHours() + 3);
  const openingHour = 9;
  const closingHour = 18;

  if (slot.getHours() < openingHour) {
    slot.setHours(openingHour, 0, 0, 0);
  } else {
    const nextSlotHour = Math.min(closingHour, slot.getHours() + 1);
    slot.setHours(nextSlotHour, 0, 0, 0);
  }

  if (slot.getHours() >= closingHour) {
    slot.setDate(slot.getDate() + 1);
    slot.setHours(openingHour, 0, 0, 0);
  }

  return slot;
}

function generateCertificateCode() {
  return `CERT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

function matchesLocation(center, location) {
  if (!location) return true;
  const haystack = `${center.location} ${center.address}`.toLowerCase();
  return haystack.includes(location.toLowerCase());
}

function donateScore(center) {
  const distancePenalty = center.distanceKm ?? 25;
  return donateCenterPriority(center) * 120 + center.rating * 100 + Math.min(center.reviewsCount, 500) / 8 - distancePenalty * 1.8;
}

function donateCenterPriority(center) {
  if (center.type === 'Donation Center') return 3;
  if (center.type === 'Hospital') return 2;
  return 1;
}

function toOpenStreetMapSearch(center) {
  return `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=15/${center.lat}/${center.lng}`;
}

async function sendOtpEmail(email, otp, name) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your Vital Veins OTP',
    text: `Hello ${name}, your Vital Veins OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your Vital Veins OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large.'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(requestPath, res) {
  const cleanPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (!filePath.startsWith(ROOT)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendJson(res, 404, { error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
