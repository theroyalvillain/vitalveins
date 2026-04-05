const authModal = document.getElementById('authModal');
const dashboardPanel = document.getElementById('dashboardPanel');
const openLoginBtn = document.getElementById('openLoginBtn');
const openSignupBtn = document.getElementById('openSignupBtn');
const closeModal = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.auth-tabs .tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const signupOtp = document.getElementById('signupOtp');
const otpStatus = document.getElementById('otpStatus');
const logoutBtn = document.getElementById('logoutBtn');
const searchBtn = document.getElementById('searchBtn');
const emergencyBtn = document.getElementById('emergencyBtn');
const centerList = document.getElementById('centerList');
const centerDetails = document.getElementById('centerDetails');
const detailName = document.getElementById('detailName');
const detailAddress = document.getElementById('detailAddress');
const detailDistance = document.getElementById('detailDistance');
const detailStock = document.getElementById('detailStock');
const mapsLink = document.getElementById('mapsLink');
const requestApprovalBtn = document.getElementById('requestApprovalBtn');
const certificateCard = document.getElementById('certificateCard');
const dashboardTitle = document.getElementById('dashboardTitle');
const topCenterLabel = document.getElementById('topCenterLabel');
const filterType = document.getElementById('filterType');
const filterLocation = document.getElementById('filterLocation');
const successStoriesSection = document.getElementById('successStoriesSection');
const storyModal = document.getElementById('storyModal');
const closeStoriesBtn = document.getElementById('closeStoriesBtn');

const needBloodPanel = document.getElementById('needBloodPanel');
const closeNeedBtn = document.getElementById('closeNeedBtn');
const searchNeedBtn = document.getElementById('searchNeedBtn');
const needBloodList = document.getElementById('needBloodList');
const needBankDetails = document.getElementById('needBankDetails');
const backFromNeedDetails = document.getElementById('backFromNeedDetails');
const viewOnMapsBtn = document.getElementById('viewOnMapsBtn');
const needBloodType = document.getElementById('needBloodType');
const needLocation = document.getElementById('needLocation');
const needLocationStatus = document.getElementById('needLocationStatus');
const needResultsMap = document.getElementById('needResultsMap');
const needBankGallery = document.getElementById('needBankGallery');
const needBankMap = document.getElementById('needBankMap');
const needBankReviewList = document.getElementById('needBankReviewList');

const donateBloodPanel = document.getElementById('donateBloodPanel');
const closeDonateBtn = document.getElementById('closeDonateBtn');
const searchDonateBtn = document.getElementById('searchDonateBtn');
const donateCenterList = document.getElementById('donateCenterList');
const donationFormPanel = document.getElementById('donationFormPanel');
const backFromDonationForm = document.getElementById('backFromDonationForm');
const donorAge = document.getElementById('donorAge');
const smokeStatus = document.getElementById('smokeStatus');
const drinkStatus = document.getElementById('drinkStatus');
const aadharCard = document.getElementById('aadharCard');
const donatedBefore = document.getElementById('donatedBefore');
const donationHistorySection = document.getElementById('donationHistorySection');
const lastDonationDate = document.getElementById('lastDonationDate');
const submitDonationBtn = document.getElementById('submitDonationBtn');
const donateBloodType = document.getElementById('donateBloodType');
const donateLocation = document.getElementById('donateLocation');
const donateLocationStatus = document.getElementById('donateLocationStatus');
const donateResultsMap = document.getElementById('donateResultsMap');
const donateNearestLabel = document.getElementById('donateNearestLabel');
const donateNearestAddress = document.getElementById('donateNearestAddress');
const donateNearestPhone = document.getElementById('donateNearestPhone');
const selectedDonateName = document.getElementById('selectedDonateName');
const selectedDonateMeta = document.getElementById('selectedDonateMeta');
const selectedDonateMaps = document.getElementById('selectedDonateMaps');
const donationAppointmentCard = document.getElementById('donationAppointmentCard');
const donationCertificateCard = document.getElementById('donationCertificateCard');
const appointmentCenterName = document.getElementById('appointmentCenterName');
const appointmentStatusBadge = document.getElementById('appointmentStatusBadge');
const appointmentSummary = document.getElementById('appointmentSummary');
const appointmentTime = document.getElementById('appointmentTime');
const appointmentAddress = document.getElementById('appointmentAddress');
const appointmentPhone = document.getElementById('appointmentPhone');
const appointmentCertificateCode = document.getElementById('appointmentCertificateCode');
const simulateCenterConfirmBtn = document.getElementById('simulateCenterConfirmBtn');
const donateBankGallery = document.getElementById('donateBankGallery');
const firstDonationCampSection = document.getElementById('firstDonationCampSection');
const donationCampList = document.getElementById('donationCampList');
const certPreviewName = document.getElementById('certPreviewName');
const certPreviewCode = document.getElementById('certPreviewCode');
const donationCertPreviewName = document.getElementById('donationCertPreviewName');
const donationCertPreviewCode = document.getElementById('donationCertPreviewCode');

const navHome = document.getElementById('navHome');
const navDonate = document.getElementById('navDonate');
const navNeed = document.getElementById('navNeed');
const logoutTopBtn = document.getElementById('logoutTopBtn');
const mainContent = document.querySelector('main');

const STORAGE_KEYS = {
  users: 'vital-users',
  session: 'vital-session',
  pendingFlow: 'pendingFlow',
  location: 'vital-geo',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MINIMUM_DONOR_AGE = 18;
const DONATION_GAP_DAYS = 90;
const ALCOHOL_WAIT_HOURS = 40;

const donationCamps = [
  { title: 'Red Cross Community Camp', date: '2026-04-11', venue: 'Town Hall, Downtown City', time: '9:00 AM - 2:00 PM' },
  { title: 'Youth Donor Drive', date: '2026-04-15', venue: 'Metro Sports Complex, City Center', time: '10:00 AM - 4:00 PM' },
  { title: 'Safe First Donation Camp', date: '2026-04-20', venue: 'Hope Wellness Auditorium, Riverside', time: '8:30 AM - 1:30 PM' },
];

let centers = [];
const savedSession = localStorage.getItem(STORAGE_KEYS.session);
let currentUser = null;
let userCoordinates = readStoredCoordinates();
let selectedNeedCenter = null;
let selectedDonationCenter = null;
let otpRequestedFor = '';
const API_BASE = resolveApiBase();
let lastNearbyMeta = { locationFilterRelaxed: false };
let needLeafletMap = null;
let donateLeafletMap = null;
let needLeafletMarkers = [];
let donateLeafletMarkers = [];
let currentDonationAppointment = null;

function readStoredCoordinates() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.location) || 'null');
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') return parsed;
  } catch (error) {
    return null;
  }
  return null;
}

function resolveApiBase() {
  const { protocol, hostname, port } = window.location;
  const isLocalHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';

  if (protocol === 'file:' || (isLocalHost && port !== '3000')) {
    return 'http://localhost:3000';
  }

  return '';
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (error) {
    throw new Error('Cannot reach the server. Start the app with "npm start" and open http://localhost:3000.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 405) {
      throw new Error('OTP request is reaching the wrong server. Start the Node app with "npm start" and use http://localhost:3000.');
    }
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }
  return data;
}

function setSession(user) {
  localStorage.setItem(STORAGE_KEYS.session, user.email);
  currentUser = user;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
  currentUser = null;
  currentDonationAppointment = null;
}

function formatAppointmentDateTime(value) {
  if (!value) return 'Pending scheduling';
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function renderCertificateFromAppointment(appointment) {
  if (!appointment || appointment.status !== 'completed') {
    certificateCard.classList.add('hidden');
    donationCertificateCard?.classList.add('hidden');
    return;
  }

  const donorName = appointment.donorName || currentUser?.name || 'Donor';
  const certificateCode = appointment.certificateCode || 'CERT-PENDING';
  certPreviewName.textContent = donorName;
  certPreviewCode.textContent = certificateCode;
  if (donationCertPreviewName) donationCertPreviewName.textContent = donorName;
  if (donationCertPreviewCode) donationCertPreviewCode.textContent = certificateCode;
  certificateCard.classList.remove('hidden');
  donationCertificateCard?.classList.remove('hidden');
}

function renderDonationAppointment(appointment) {
  currentDonationAppointment = appointment || null;

  if (!donationAppointmentCard) return;

  if (!appointment) {
    donationAppointmentCard.classList.add('hidden');
    renderCertificateFromAppointment(null);
    return;
  }

  donationAppointmentCard.classList.remove('hidden');
  appointmentCenterName.textContent = appointment.centerName;
  appointmentStatusBadge.textContent = appointment.status === 'completed' ? 'Completed' : 'Booked';
  appointmentSummary.textContent =
    appointment.status === 'completed'
      ? `Donation confirmed by ${appointment.centerName}. Your digital certificate is now active.`
      : `Appointment booked with ${appointment.centerName}. Please arrive 15 minutes early with a valid ID.`;
  appointmentTime.textContent = formatAppointmentDateTime(appointment.appointmentAt);
  appointmentAddress.textContent = appointment.centerAddress;
  appointmentPhone.textContent = appointment.centerPhone || 'Contact not listed';
  appointmentCertificateCode.textContent =
    appointment.certificateCode || 'Pending center confirmation';
  simulateCenterConfirmBtn.classList.toggle('hidden', appointment.status === 'completed');
  renderCertificateFromAppointment(appointment);
}

async function loadDonationAppointment() {
  if (!currentUser?.email) {
    renderDonationAppointment(null);
    return;
  }

  try {
    const response = await apiRequest(`/api/donations/by-email?email=${encodeURIComponent(currentUser.email)}`);
    renderDonationAppointment(response.appointment || null);
  } catch (error) {
    renderDonationAppointment(null);
  }
}

function getSignupPayload() {
  return {
    name: document.getElementById('signupName').value.trim(),
    email: document.getElementById('signupEmail').value.trim().toLowerCase(),
    password: document.getElementById('signupPassword').value,
    bloodGroup: document.getElementById('signupBlood').value,
    location: document.getElementById('signupLocation').value.trim(),
  };
}

function resetOtpState() {
  otpRequestedFor = '';
  if (signupOtp) signupOtp.value = '';
  if (otpStatus) otpStatus.textContent = 'Send OTP to verify your email before creating the account.';
}

function openModal() { authModal.classList.remove('hidden'); }
function closeModalWindow() { authModal.classList.add('hidden'); }

function switchTab(view) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  loginForm.classList.toggle('active', view === 'login');
  signupForm.classList.toggle('active', view === 'signup');
  if (view === 'signup') {
    resetOtpState();
  }
}

function updateNavBar() {
  openLoginBtn.classList.toggle('hidden', Boolean(currentUser));
  openSignupBtn.classList.toggle('hidden', Boolean(currentUser));
  logoutTopBtn.classList.toggle('hidden', !currentUser);
}

function setNavActive(page) {
  [navHome, navDonate, navNeed].forEach((button) => button.classList.remove('active'));
  if (page === 'home') navHome.classList.add('active');
  if (page === 'donate') navDonate.classList.add('active');
  if (page === 'need') navNeed.classList.add('active');
}

function hidePanels() {
  dashboardPanel.classList.add('hidden');
  needBloodPanel.classList.add('hidden');
  donateBloodPanel.classList.add('hidden');
  mainContent.classList.add('hidden');
}

function switchPage(page) {
  hidePanels();
  if (page === 'home') {
    mainContent.classList.remove('hidden');
    setNavActive('home');
    return;
  }

  if (!currentUser) {
    localStorage.setItem(STORAGE_KEYS.pendingFlow, page);
    switchTab('login');
    openModal();
    return;
  }

  if (page === 'need') {
    needBloodPanel.classList.remove('hidden');
    setNavActive('need');
    initializeNeedFlow();
    return;
  }

  donateBloodPanel.classList.remove('hidden');
  setNavActive('donate');
  initializeDonateFlow();
}

function initializeNeedFlow() {
  needLocation.value = currentUser?.location || '';
  needBloodType.value = currentUser?.bloodGroup || '';
  needBankDetails.classList.add('hidden');
  needBloodList.classList.remove('hidden');
  updateLocationBanner(needLocationStatus, 'need');
  requestLocation(false, searchNeedBlood);
  searchNeedBlood();
}

function initializeDonateFlow() {
  donateLocation.value = currentUser?.location || '';
  donateBloodType.value = currentUser?.bloodGroup || 'A+';
  donationFormPanel.classList.add('hidden');
  donateCenterList.classList.remove('hidden');
  resetDonationForm();
  renderDonationAppointment(currentDonationAppointment);
  updateLocationBanner(donateLocationStatus, 'donate');
  requestLocation(false, searchDonationCenters);
  searchDonationCenters();
}

function updateLocationBanner(element, flow) {
  if (!element) return;
  const fallbackLocation = flow === 'need' ? needLocation.value.trim() : donateLocation.value.trim();
  if (userCoordinates) {
    element.textContent = `Using live location for nearest ${flow === 'need' ? 'blood banks' : 'donation centers'}${fallbackLocation ? ` and saved area: ${fallbackLocation}.` : '.'}`;
    return;
  }
  if (fallbackLocation) {
    element.textContent = `Live location unavailable. Showing nearby results using your saved area: ${fallbackLocation}.`;
    return;
  }
  element.textContent = 'Live location unavailable. Enter an area to refine nearby results.';
}

function requestLocation(forcePrompt, callback) {
  if (!navigator.geolocation) {
    updateLocationBanner(needLocationStatus, 'need');
    updateLocationBanner(donateLocationStatus, 'donate');
    if (callback) callback();
    return;
  }

  if (userCoordinates && !forcePrompt) {
    if (callback) callback();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
      localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(userCoordinates));
      updateLocationBanner(needLocationStatus, 'need');
      updateLocationBanner(donateLocationStatus, 'donate');
      if (callback) callback();
    },
    () => {
      updateLocationBanner(needLocationStatus, 'need');
      updateLocationBanner(donateLocationStatus, 'donate');
      if (callback) callback();
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
  );
}

function toMapEmbed(center) {
  const delta = 0.02;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - delta}%2C${center.lat - delta}%2C${center.lng + delta}%2C${center.lat + delta}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
}

function toMapSearch(center) {
  return `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=15/${center.lat}/${center.lng}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function getDistanceKm(center) {
  if (!userCoordinates) return null;
  return haversineKm(userCoordinates.lat, userCoordinates.lng, center.lat, center.lng);
}

function formatDistance(center) {
  if (center.distance) return center.distance;
  const km = getDistanceKm(center);
  return km === null ? 'Nearby' : `${km.toFixed(1)} km`;
}

function ensureResultsMap(mapElement, existingMap) {
  if (!mapElement || typeof window.L === 'undefined') return null;
  if (existingMap) return existingMap;

  const map = window.L.map(mapElement, { zoomControl: true, scrollWheelZoom: true });
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  return map;
}

function createNumberedMarker(center, index) {
  return window.L.marker([center.lat, center.lng], {
    icon: window.L.divIcon({
      className: 'map-marker-wrapper',
      html: `<div class="map-marker-pin">${index + 1}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -12],
    }),
  }).bindPopup(
    `<div class="map-popup"><strong>${center.name}</strong><div>${center.address}</div><div>${center.phone || 'Contact not listed'}</div></div>`
  );
}

function renderResultsMap(mapElement, flow, results) {
  if (!mapElement || typeof window.L === 'undefined') return;

  const targetMap = flow === 'need'
    ? (needLeafletMap = ensureResultsMap(mapElement, needLeafletMap))
    : (donateLeafletMap = ensureResultsMap(mapElement, donateLeafletMap));
  if (!targetMap) return;

  const markerBucket = flow === 'need' ? needLeafletMarkers : donateLeafletMarkers;
  markerBucket.forEach((marker) => marker.remove());
  markerBucket.length = 0;

  const bounds = [];
  results.slice(0, 10).forEach((center, index) => {
    if (typeof center.lat !== 'number' || typeof center.lng !== 'number') return;
    const marker = createNumberedMarker(center, index).addTo(targetMap);
    markerBucket.push(marker);
    bounds.push([center.lat, center.lng]);
  });

  if (userCoordinates && typeof userCoordinates.lat === 'number' && typeof userCoordinates.lng === 'number') {
    const userMarker = window.L.circleMarker([userCoordinates.lat, userCoordinates.lng], {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: '#60a5fa',
      fillOpacity: 0.9,
    }).bindPopup('Your current location').addTo(targetMap);
    markerBucket.push(userMarker);
    bounds.push([userCoordinates.lat, userCoordinates.lng]);
  }

  if (bounds.length) {
    targetMap.fitBounds(bounds, { padding: [28, 28] });
  } else if (userCoordinates) {
    targetMap.setView([userCoordinates.lat, userCoordinates.lng], 11);
  } else {
    targetMap.setView([28.6139, 77.209], 10);
  }

  setTimeout(() => targetMap.invalidateSize(), 0);
}

function getLocationQueryValue(flow) {
  return (flow === 'need' ? needLocation.value : donateLocation.value).trim().toLowerCase();
}

function getCenterStockLine(center) {
  const stockByType = center.stockByType || {};
  const stockLine = BLOOD_TYPES.filter((type) => stockByType[type]).map((type) => `${type} ${stockByType[type]} units`).join(', ');
  return stockLine || 'Live stock data is not available for this center.';
}

function centerHasType(center, bloodType) {
  if (!center.stockByType || !Object.keys(center.stockByType).length) return true;
  if (!bloodType) return true;
  return Number(center.stockByType[bloodType] || 0) > 0;
}

function centerMatchesLocation(center, locationQuery) {
  if (!locationQuery) return true;
  const haystack = `${center.location} ${center.address}`.toLowerCase();
  return haystack.includes(locationQuery);
}

function centerDistanceSort(a, b) {
  const aDistance = getDistanceKm(a);
  const bDistance = getDistanceKm(b);
  if (aDistance === null && bDistance === null) return a.rating - b.rating;
  if (aDistance === null) return 1;
  if (bDistance === null) return -1;
  return aDistance - bDistance;
}

function donationCenterScore(center) {
  const distancePenalty = getDistanceKm(center) ?? 25;
  return center.rating * 100 + Math.min(center.reviewsCount, 500) / 8 - distancePenalty * 1.8;
}

async function fetchNearbyCenters(mode) {
  if (userCoordinates && (mode === 'donate' || mode === 'need')) {
    try {
      const liveResponse = await apiRequest(
        `/api/donation-centers/live?lat=${encodeURIComponent(String(userCoordinates.lat))}&lng=${encodeURIComponent(String(userCoordinates.lng))}&radiusKm=40`
      );
      centers = liveResponse.centers || [];
      lastNearbyMeta = {
        locationFilterRelaxed: false,
        source: liveResponse.source || 'openstreetmap',
      };
      return centers;
    } catch (error) {
      lastNearbyMeta = {
        locationFilterRelaxed: false,
        source: 'fallback',
      };
    }
  }

  const params = new URLSearchParams();
  const bloodType = mode === 'need' ? needBloodType.value.trim() : donateBloodType.value.trim();
  const location = mode === 'need' ? needLocation.value.trim() : donateLocation.value.trim();

  if (bloodType) params.set('bloodType', bloodType);
  if (location) params.set('location', location);
  params.set('mode', mode);
  if (userCoordinates) {
    params.set('lat', String(userCoordinates.lat));
    params.set('lng', String(userCoordinates.lng));
  }

  const response = await apiRequest(`/api/centers/nearby?${params.toString()}`);
  centers = response.centers || [];
  lastNearbyMeta = {
    locationFilterRelaxed: Boolean(response.locationFilterRelaxed),
    source: 'local',
  };
  if (response.origin && typeof response.origin.lat === 'number' && typeof response.origin.lng === 'number') {
    userCoordinates = { lat: response.origin.lat, lng: response.origin.lng };
    localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(userCoordinates));
  }
  return centers;
}

function createCardMarkup(center, flow) {
  const activeType = flow === 'need' ? needBloodType.value : donateBloodType.value;
  const stockByType = center.stockByType || {};
  const typeLine = activeType && stockByType[activeType]
    ? `${stockByType[activeType]} units of ${activeType}`
    : getCenterStockLine(center);
  const supportingLine = flow === 'need' ? typeLine : `Phone: ${center.phone || 'Contact not listed'}`;

  return `
    <div class="bank-card-head">
      <div>
        <h4>${center.name}</h4>
        <small>${center.type}</small>
      </div>
      <span class="rating-pill">⭐ ${center.rating}</span>
    </div>
    <p class="bank-card-address">${center.address}</p>
    <div class="bank-card-meta">
      <span>${formatDistance(center)} away</span>
      <span>${center.reviewsCount} reviews</span>
    </div>
    <p class="bank-card-stock">${supportingLine}</p>
  `;
}

function renderGallery(container, images, altPrefix) {
  if (!container) return;
  if (!images || !images.length) {
    container.innerHTML = '<p class="empty-state">No center photos available.</p>';
    return;
  }
  container.innerHTML = images.map((src, index) => `<img src="${src}" alt="${altPrefix} ${index + 1}" />`).join('');
}

function renderReviews(container, reviews) {
  if (!container) return;
  if (!reviews || !reviews.length) {
    container.innerHTML = '<p class="empty-state">No public reviews available for this center.</p>';
    return;
  }
  container.innerHTML = reviews.map((review) => `
    <article class="review-card">
      <strong>${review.author}</strong>
      <p>${review.text}</p>
    </article>
  `).join('');
}

function renderNeedBloodList(results) {
  needBloodList.innerHTML = '';
  renderResultsMap(needResultsMap, 'need', results);
  if (!results.length) {
    needBloodList.innerHTML = '<p class="empty-state">No blood banks found for this blood type and area.</p>';
    return;
  }

  results.forEach((center) => {
    const card = document.createElement('article');
    card.className = 'bank-card';
    card.innerHTML = createCardMarkup(center, 'need');
    card.addEventListener('click', () => showNeedBankDetails(center));
    needBloodList.appendChild(card);
  });
}

function showNeedBankDetails(center) {
  selectedNeedCenter = center;
  needBloodList.classList.add('hidden');
  needBankDetails.classList.remove('hidden');

  document.getElementById('needBankName').textContent = center.name;
  document.getElementById('needBankType').textContent = center.type;
  document.getElementById('needBankAddress').textContent = center.address;
  document.getElementById('needBankPhone').innerHTML = center.phone && center.phone !== 'Contact not listed'
    ? `<a href="tel:${center.phone}">${center.phone}</a>`
    : 'Contact not listed';
  document.getElementById('needBankDistance').textContent = formatDistance(center);
  document.getElementById('needBankStock').textContent = getCenterStockLine(center);
  document.getElementById('needBankRating').textContent = `${center.rating}/5`;
  document.getElementById('needBankReviews').textContent = `${center.reviewsCount} verified reviews`;
  needBankMap.src = toMapEmbed(center);
  renderGallery(needBankGallery, center.images, `${center.name} image`);
  renderReviews(needBankReviewList, center.reviewSnippets);
}

function renderDonateCenterList(results) {
  donateCenterList.innerHTML = '';
  renderResultsMap(donateResultsMap, 'donate', results);
  if (!results.length) {
    updateNearestDonationSummary(null);
    donateCenterList.innerHTML = '<p class="empty-state">No donation centers matched this blood type and area.</p>';
    return;
  }

  updateNearestDonationSummary(results[0]);

  results.forEach((center, index) => {
    const card = document.createElement('article');
    card.className = 'bank-card';
    card.innerHTML = `
      ${createCardMarkup(center, 'donate')}
      <div class="donation-rank">${index === 0 ? 'Nearest available donation center' : 'Other nearby center'}</div>
    `;
    card.addEventListener('click', () => openDonationForm(center));
    donateCenterList.appendChild(card);
  });
}

function updateNearestDonationSummary(center) {
  if (!donateNearestLabel || !donateNearestAddress || !donateNearestPhone) return;

  if (!center) {
    donateNearestLabel.textContent = 'No donation center is available for the current search.';
    donateNearestAddress.textContent = 'Try allowing location access or removing the area filter.';
    donateNearestPhone.textContent = 'No contact available';
    donateNearestPhone.removeAttribute('href');
    return;
  }

  const sourceLabel = lastNearbyMeta.source === 'openstreetmap' ? 'Live nearby result' : 'Nearest available result';
  donateNearestLabel.textContent = `${sourceLabel}: ${center.name}${center.distance ? ` • ${center.distance} away` : ''}.`;
  donateNearestAddress.textContent = center.address;
  donateNearestPhone.textContent = center.phone;
  if (center.phone && center.phone !== 'Contact not listed') {
    donateNearestPhone.href = `tel:${center.phone}`;
  } else {
    donateNearestPhone.removeAttribute('href');
  }
}

function renderDonationCamps() {
  donationCampList.innerHTML = donationCamps.map((camp) => `
    <article class="camp-card">
      <strong>${camp.title}</strong>
      <p>${new Date(camp.date).toLocaleDateString()}</p>
      <p>${camp.venue}</p>
      <p>${camp.time}</p>
    </article>
  `).join('');
}

function openDonationForm(center) {
  selectedDonationCenter = center;
  donateCenterList.classList.add('hidden');
  donationFormPanel.classList.remove('hidden');
  selectedDonateName.textContent = center.name;
  selectedDonateMeta.textContent = `${center.address} • ${center.phone} • ${formatDistance(center)} away • ${center.rating}/5 (${center.reviewsCount} reviews)`;
  selectedDonateMaps.href = toMapSearch(center);
  renderGallery(donateBankGallery, center.images, `${center.name} photo`);
}

async function searchNeedBlood() {
  updateLocationBanner(needLocationStatus, 'need');
  try {
    const results = await fetchNearbyCenters('need');
    if (lastNearbyMeta.source === 'openstreetmap') {
      needLocationStatus.textContent = 'Showing live nearby blood banks and donation centers from OpenStreetMap around your current location.';
    }
    if (lastNearbyMeta.locationFilterRelaxed) {
      needLocationStatus.textContent = 'No exact area match was found, so these results are ranked by your live location instead.';
    }
    renderNeedBloodList(results);
  } catch (error) {
    needBloodList.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
}

async function searchDonationCenters() {
  updateLocationBanner(donateLocationStatus, 'donate');
  try {
    const results = await fetchNearbyCenters('donate');
    if (lastNearbyMeta.source === 'openstreetmap') {
      donateLocationStatus.textContent = 'Showing live nearby donation centers from OpenStreetMap around your current location.';
    }
    if (lastNearbyMeta.locationFilterRelaxed) {
      donateLocationStatus.textContent = 'No exact area match was found, so these centers are ranked by your live location instead.';
    }
    renderDonateCenterList(results);
  } catch (error) {
    donateCenterList.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
}

function showDashboard() {
  dashboardPanel.classList.remove('hidden');
  centerDetails.classList.add('hidden');
  certificateCard.classList.add('hidden');
  topCenterLabel.textContent = 'Searching partner centers based on your saved profile and current location.';
  filterLocation.value = currentUser?.location || '';
  filterType.value = currentUser?.bloodGroup || 'O+';
  updateDashboardTitle();
  searchCenters();
}

function updateDashboardTitle() { dashboardTitle.textContent = 'Search blood availability'; }

async function searchCenters() {
  centerList.innerHTML = '';
  try {
    const params = new URLSearchParams();
    if (filterType.value) params.set('bloodType', filterType.value);
    if (filterLocation.value.trim()) params.set('location', filterLocation.value.trim());
    params.set('mode', 'need');
    if (userCoordinates) {
      params.set('lat', String(userCoordinates.lat));
      params.set('lng', String(userCoordinates.lng));
    }
    const response = await apiRequest(`/api/centers/nearby?${params.toString()}`);
    centers = response.centers || [];
    if (!centers.length) {
      centerList.innerHTML = '<p class="empty-state">No centers found for this search.</p>';
      return;
    }
    topCenterLabel.textContent = lastNearbyMeta.locationFilterRelaxed
      ? `${centers[0].name} is the nearest match from your current location.`
      : `${centers[0].name} looks nearest for ${filterType.value}.`;
    centers.forEach((center) => {
      const card = document.createElement('article');
      card.className = 'center-card';
      card.innerHTML = `
        <strong>${center.name}</strong>
        <small>${center.address}</small>
        <div class="card-footer">
          <span>${formatDistance(center)} away</span>
          <button class="secondary" data-id="${center.id}">View details</button>
        </div>
      `;
      centerList.appendChild(card);
    });
  } catch (error) {
    centerList.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
}

function openCenterDetails(centerId) {
  const center = centers.find((item) => item.id === centerId);
  if (!center) return;
  detailName.textContent = center.name;
  detailAddress.textContent = center.address;
  detailDistance.textContent = formatDistance(center);
  detailStock.textContent = getCenterStockLine(center);
  mapsLink.href = toMapSearch(center);
  centerDetails.classList.remove('hidden');
  certificateCard.classList.add('hidden');
}

function resetDonationForm() {
  donorAge.value = '';
  smokeStatus.value = '';
  drinkStatus.value = '';
  aadharCard.value = '';
  donatedBefore.value = '';
  lastDonationDate.value = '';
  donationHistorySection.classList.add('hidden');
  firstDonationCampSection.classList.add('hidden');
  document.getElementById('ageWarning').classList.add('hidden');
  document.getElementById('donationWaitingWarning').classList.add('hidden');
  document.getElementById('alcoholWarning').classList.add('hidden');
  submitDonationBtn.disabled = false;
}

function validateAge() {
  const age = Number(donorAge.value);
  const warning = document.getElementById('ageWarning');

  if (!age) {
    warning.classList.add('hidden');
    submitDonationBtn.disabled = false;
    return true;
  }

  if (age < MINIMUM_DONOR_AGE) {
    const daysLeft = Math.ceil((MINIMUM_DONOR_AGE - age) * 365);
    warning.textContent = `You cannot donate yet. You need to reach age ${MINIMUM_DONOR_AGE}. Approximate waiting time: ${daysLeft} days.`;
    warning.classList.remove('hidden');
    submitDonationBtn.disabled = true;
    return false;
  }

  if (age > 65) {
    warning.textContent = 'Age above 65 usually requires a doctor approval before donation.';
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }

  submitDonationBtn.disabled = false;
  return true;
}

function validateAlcohol() {
  const warning = document.getElementById('alcoholWarning');
  if (drinkStatus.value === 'yes' || drinkStatus.value === 'occasionally') {
    warning.textContent = `If you drank alcohol within the last ${ALCOHOL_WAIT_HOURS} hours, you cannot donate today.`;
    warning.classList.remove('hidden');
    return false;
  }
  warning.classList.add('hidden');
  return true;
}

function validateDonationHistory() {
  const warning = document.getElementById('donationWaitingWarning');
  if (!lastDonationDate.value) {
    warning.classList.add('hidden');
    submitDonationBtn.disabled = false;
    return true;
  }

  const lastDate = new Date(lastDonationDate.value);
  const today = new Date();
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const daysSinceDonation = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (daysSinceDonation < DONATION_GAP_DAYS) {
    const eligibleDate = new Date(lastDate);
    eligibleDate.setDate(lastDate.getDate() + DONATION_GAP_DAYS);
    document.getElementById('canDonateDate').textContent = eligibleDate.toLocaleDateString();
    warning.classList.remove('hidden');
    submitDonationBtn.disabled = true;
    return false;
  }

  warning.classList.add('hidden');
  submitDonationBtn.disabled = false;
  return true;
}

function handleDonationHistoryVisibility() {
  const hasDonatedBefore = donatedBefore.value === 'yes';
  donationHistorySection.classList.toggle('hidden', !hasDonatedBefore);
  firstDonationCampSection.classList.toggle('hidden', hasDonatedBefore);

  if (!hasDonatedBefore) {
    renderDonationCamps();
    document.getElementById('donationWaitingWarning').classList.add('hidden');
    submitDonationBtn.disabled = false;
  }
}

function validateAadhar() {
  return /^\d{12}$/.test(aadharCard.value.trim());
}

function getDonationBookingPayload() {
  return {
    userEmail: currentUser?.email,
    donorAge: Number(donorAge.value),
    smokeStatus: smokeStatus.value,
    drinkStatus: drinkStatus.value,
    donatedBefore: donatedBefore.value,
    lastDonationDate: lastDonationDate.value || null,
    aadharNumber: aadharCard.value.trim(),
    center: selectedDonationCenter,
  };
}

async function validateDonationForm() {
  const ageOk = validateAge();
  const donatedValue = donatedBefore.value;

  if (!selectedDonationCenter) {
    alert('Please choose a donation center first.');
    return;
  }
  if (!ageOk) {
    alert('You are currently not eligible to donate because you are below the minimum donation age.');
    return;
  }
  if (!smokeStatus.value || !drinkStatus.value || !donatedValue) {
    alert('Please fill all required medical questions before proceeding.');
    return;
  }
  if (!validateAadhar()) {
    alert('Please enter a valid 12-digit Aadhar number.');
    return;
  }
  if ((drinkStatus.value === 'yes' || drinkStatus.value === 'occasionally') && !confirm(`Have you avoided alcohol for at least ${ALCOHOL_WAIT_HOURS} hours?`)) {
    return;
  }
  if (donatedValue === 'yes') {
    if (!lastDonationDate.value) {
      alert('Please enter your last donation date.');
      return;
    }
    if (!validateDonationHistory()) {
      const eligibleDate = document.getElementById('canDonateDate').textContent;
      alert(`You cannot donate yet. Your 90-day waiting period completes on ${eligibleDate}.`);
      return;
    }
  }

  try {
    submitDonationBtn.disabled = true;
    submitDonationBtn.textContent = 'Booking Appointment...';
    const response = await apiRequest('/api/donations/book', {
      method: 'POST',
      body: JSON.stringify(getDonationBookingPayload()),
    });
    renderDonationAppointment(response.appointment);
    alert(`Appointment booked at ${response.appointment.centerName} for ${formatAppointmentDateTime(response.appointment.appointmentAt)}.`);
  } catch (error) {
    if (error.message.includes('already have a booked donation appointment')) {
      await loadDonationAppointment();
    }
    alert(error.message);
  } finally {
    submitDonationBtn.disabled = false;
    submitDonationBtn.textContent = 'Book Donation Appointment';
  }
}

async function confirmDonationFromCenter() {
  if (!currentDonationAppointment?.id) return;

  try {
    simulateCenterConfirmBtn.disabled = true;
    simulateCenterConfirmBtn.textContent = 'Confirming...';
    const response = await apiRequest('/api/donations/confirm', {
      method: 'POST',
      body: JSON.stringify({ appointmentId: currentDonationAppointment.id }),
    });
    renderDonationAppointment(response.appointment);
    alert(`Donation confirmed. Certificate ${response.appointment.certificateCode} is now generated.`);
  } catch (error) {
    alert(error.message);
  } finally {
    simulateCenterConfirmBtn.disabled = false;
    simulateCenterConfirmBtn.textContent = 'Center Confirms Donation';
  }
}

openLoginBtn.addEventListener('click', () => { switchTab('login'); openModal(); });
openSignupBtn.addEventListener('click', () => { switchTab('signup'); openModal(); });
closeModal.addEventListener('click', closeModalWindow);
tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.view)));

navHome.addEventListener('click', () => switchPage('home'));
navDonate.addEventListener('click', () => switchPage('donate'));
navNeed.addEventListener('click', () => switchPage('need'));

logoutTopBtn.addEventListener('click', () => {
  clearSession();
  renderDonationAppointment(null);
  updateNavBar();
  switchPage('home');
});

logoutBtn?.addEventListener('click', () => {
  clearSession();
  renderDonationAppointment(null);
  updateNavBar();
  switchPage('home');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSession(response.user);
    await loadDonationAppointment();
    updateNavBar();
    closeModalWindow();
    const pendingFlow = localStorage.getItem(STORAGE_KEYS.pendingFlow) || 'home';
    localStorage.removeItem(STORAGE_KEYS.pendingFlow);
    switchPage(pendingFlow);
  } catch (error) {
    alert(error.message);
  }
});

sendOtpBtn?.addEventListener('click', async () => {
  const payload = getSignupPayload();
  if (!payload.name || !payload.email || !payload.password || !payload.bloodGroup || !payload.location) {
    otpStatus.textContent = 'Please fill all signup details first, then tap Send OTP.';
    return;
  }

  try {
    sendOtpBtn.disabled = true;
    otpStatus.textContent = `Sending OTP to ${payload.email}...`;
    await apiRequest('/api/auth/request-signup-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    otpRequestedFor = payload.email;
    otpStatus.textContent = `OTP sent to ${payload.email}. Enter the 6-digit code below, then tap Verify OTP & Register.`;
  } catch (error) {
    otpStatus.textContent = error.message;
    if (error.message.includes('already registered')) {
      switchTab('login');
    }
  } finally {
    sendOtpBtn.disabled = false;
  }
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { email } = getSignupPayload();
  const otp = signupOtp.value.trim();

  try {
    if (!otpRequestedFor || otpRequestedFor !== email) {
      otpStatus.textContent = 'Please tap Send OTP first.';
      return;
    }
    if (!otp) {
      otpStatus.textContent = 'Please enter the OTP sent to your email.';
      return;
    }
    const response = await apiRequest('/api/auth/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    setSession(response.user);
    await loadDonationAppointment();
    otpStatus.textContent = 'OTP verified successfully. Account created.';
    updateNavBar();
    closeModalWindow();
    const pendingFlow = localStorage.getItem(STORAGE_KEYS.pendingFlow) || 'home';
    localStorage.removeItem(STORAGE_KEYS.pendingFlow);
    switchPage(pendingFlow);
  } catch (error) {
    otpStatus.textContent = error.message;
    if (error.message.includes('already registered')) {
      switchTab('login');
    }
  }
});

searchBtn?.addEventListener('click', searchCenters);
emergencyBtn?.addEventListener('click', () => alert('Emergency request submitted. Nearby verified centers will be prioritized.'));

centerList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  openCenterDetails(button.dataset.id);
});

requestApprovalBtn?.addEventListener('click', () => certificateCard.classList.remove('hidden'));
successStoriesSection?.addEventListener('click', () => storyModal.classList.remove('hidden'));
closeStoriesBtn?.addEventListener('click', () => storyModal.classList.add('hidden'));
storyModal?.addEventListener('click', (event) => {
  if (event.target === storyModal) storyModal.classList.add('hidden');
});

closeNeedBtn.addEventListener('click', () => switchPage('home'));
closeDonateBtn.addEventListener('click', () => switchPage('home'));

backFromNeedDetails.addEventListener('click', () => {
  selectedNeedCenter = null;
  needBankDetails.classList.add('hidden');
  needBloodList.classList.remove('hidden');
});

backFromDonationForm.addEventListener('click', () => {
  selectedDonationCenter = null;
  donationFormPanel.classList.add('hidden');
  donateCenterList.classList.remove('hidden');
  resetDonationForm();
});

searchNeedBtn.addEventListener('click', () => {
  requestLocation(false, searchNeedBlood);
  searchNeedBlood();
});

searchDonateBtn.addEventListener('click', () => {
  requestLocation(false, searchDonationCenters);
  searchDonationCenters();
});

viewOnMapsBtn.addEventListener('click', () => {
  if (selectedNeedCenter) window.open(toMapSearch(selectedNeedCenter), '_blank', 'noopener');
});

donatedBefore.addEventListener('change', handleDonationHistoryVisibility);
lastDonationDate.addEventListener('change', validateDonationHistory);
donorAge.addEventListener('input', validateAge);
drinkStatus.addEventListener('change', validateAlcohol);
submitDonationBtn.addEventListener('click', validateDonationForm);
simulateCenterConfirmBtn?.addEventListener('click', confirmDonationFromCenter);

needLocation.addEventListener('input', searchNeedBlood);
needBloodType.addEventListener('change', searchNeedBlood);
donateLocation.addEventListener('input', searchDonationCenters);
donateBloodType.addEventListener('change', searchDonationCenters);

async function hydrateCurrentUser() {
  if (!savedSession) return;
  try {
    const response = await apiRequest(`/api/users/by-email?email=${encodeURIComponent(savedSession)}`);
    currentUser = response.user;
  } catch (error) {
    clearSession();
  }
}

async function initializeApp() {
  await hydrateCurrentUser();
  await loadDonationAppointment();
  updateNavBar();
  switchPage('home');
  requestLocation(false);
}

initializeApp();
