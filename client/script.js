/* global localStorage, alert, fetch, location */
'use strict';

import QRCode from 'qrcode';

// ==================== CONFIGURATION ====================
const USE_MOCK_API = false;
const API_BASE_URL = '/api';

// ==================== STATE ====================
const pages = { customer: 1, halls: 1, screenings: 1 };
let selectedScreening = null;
let selectedSeats = [];
let lastCustomerScreenings = [];

// ==================== 1. DYNAMIC PAGINATION ====================
function calculateLimit () {
  const windowHeight = window.innerHeight;
  const isOperator = document.getElementById('operator-area').classList.contains('active');

  // Compact mode for phones (height < 850px)
  const isSmallScreen = windowHeight < 850;

  let overhead;

  if (isSmallScreen) {
    // Compact overhead
    overhead = isOperator ? 350 : 180;
  } else {
    // Normal overhead
    overhead = isOperator ? 520 : 350;
  }

  const availableHeight = windowHeight - overhead;

  // Height of one table row (approx 55px)
  const rowHeight = 55;

  const rows = Math.floor(availableHeight / rowHeight);

  // Allow minimum 1 row so table doesn't disappear on tiny screens
  return Math.max(1, rows);
}

// ==================== 2. HELPER: DATE FORMAT ====================
function formatStartDE (isoOrDate) {
  const d = (isoOrDate instanceof Date) ? isoOrDate : new Date(isoOrDate);
  return d.toLocaleString('de-DE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== 3. API CLIENT ====================
const api = {
  async get (endpoint, page, maxRows = 100) {
    // 1. Calculate how many fit on screen
    const dynamicLimit = calculateLimit();

    // 2. Pick the smaller number: what fits vs. max allowed
    const limit = Math.min(maxRows, dynamicLimit);

    if (USE_MOCK_API) {
      const key = endpoint.includes('halls') ? 'cinemaHalls' : 'cinemaScreenings';
      const data = JSON.parse(localStorage.getItem(key)) || [];
      return {
        items: data.slice((page - 1) * limit, page * limit),
        total: Math.ceil(data.length / limit) || 1,
        current: page
      };
    }

    const res = await fetch(`${API_BASE_URL}/${endpoint}?page=${page}&limit=${limit}`);
    const json = await res.json();
    return { items: json.items, total: json.totalPages, current: json.currentPage };
  },

  async post (endpoint, data) {
    if (USE_MOCK_API) {
      const key = endpoint === 'halls' ? 'cinemaHalls' : endpoint === 'screenings' ? 'cinemaScreenings' : 'cinemaReservations';
      const items = JSON.parse(localStorage.getItem(key)) || [];
      const newItem = { id: Date.now().toString(), ...data };
      items.push(newItem);
      localStorage.setItem(key, JSON.stringify(items));
      return newItem;
    }
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async createReservation (data) {
    return api.post('reservations', data);
  },

  async getReservations (screeningId) {
    if (USE_MOCK_API) {
      const all = JSON.parse(localStorage.getItem('cinemaReservations')) || [];
      return all.filter(r => String(r.screeningId) === String(screeningId));
    }
    const res = await fetch(`${API_BASE_URL}/screenings/${screeningId}/reservations`);
    return res.json();
  }
};

// ==================== 4. HELPERS: LOAD ALL HALLS ====================
async function fetchAllHalls () {
  const all = [];
  let page = 1;
  while (true) {
    // For internal fetching (dropdowns), we use a larger limit to get data fast
    const res = await fetch(`${API_BASE_URL}/halls?page=${page}&limit=50`);
    const data = await res.json();
    const items = data.items || [];
    all.push(...items);
    if (page >= (data.totalPages || 1)) break;
    page++;
  }
  return all;
}

async function refreshHallSelect () {
  const sel = document.getElementById('screening-hall');
  if (!sel) return;
  const halls = await fetchAllHalls();
  sel.innerHTML = halls.length
    ? halls.map(h => `<option value="${h.id}">${h.name}</option>`).join('')
    : '<option value="">(Keine Säle vorhanden)</option>';
}

// ==================== 5. UI HELPERS ====================
function renderPager (id, current, total) {
  const el = document.getElementById(id);
  if (!el) return;
  if (total <= 1) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <button class="btn-secondary" onclick="changePage('${id}', ${current - 1})" ${current === 1 ? 'disabled' : ''}>Zurück</button>
    <span style="margin:0 10px;">Seite ${current} / ${total}</span>
    <button class="btn-secondary" onclick="changePage('${id}', ${current + 1})" ${current === total ? 'disabled' : ''}>Weiter</button>
  `;
}

window.changePage = (id, p) => {
  if (p < 1) return;
  if (id.includes('customer')) { pages.customer = p; renderCustomer(); }
  if (id.includes('halls')) { pages.halls = p; renderHalls(); }
  if (id.includes('screenings')) { pages.screenings = p; renderOpScreenings(); }
};

window.selectScrById = (id) => {
  const s = lastCustomerScreenings.find(x => String(x.id) === String(id));
  if (!s) return;
  selectScr(s);
};

// ==================== 6. RENDERERS ====================

async function renderCustomer () {
  const tbody = document.getElementById('customer-screenings-list');
  if (!tbody) return;
  const data = await api.get('screenings', pages.customer, 25);
  lastCustomerScreenings = data.items || [];

  tbody.innerHTML = lastCustomerScreenings.map(s => `
    <tr>
      <td>${s.movie}</td>
      <td>${formatStartDE(s.start)}</td>
      <td>${s.hallName || '-'}</td>
      <td style="text-align:center">
        <button class="btn-select" onclick="selectScrById('${String(s.id)}')">Reservieren</button>
      </td>
    </tr>
  `).join('');
  renderPager('customer-screenings-pagination', data.current, data.total);
}

async function renderHalls () {
  const tbody = document.getElementById('operator-halls-list');
  if (!tbody) return;
  const data = await api.get('halls', pages.halls, 25);
  tbody.innerHTML = (data.items || []).map(h => `
    <tr>
      <td>${h.name}</td>
      <td>${h.rows}</td>
      <td>${h.seatsPerRow}</td>
      <td>${h.rows * h.seatsPerRow}</td>
    </tr>
  `).join('');
  renderPager('operator-halls-pagination', data.current, data.total);
}

async function renderOpScreenings () {
  const tbody = document.getElementById('operator-screenings-list');
  if (!tbody) return;
  const data = await api.get('screenings', pages.screenings, 25);
  const items = data.items || [];

  const reservationsByScreening = await Promise.all(
    items.map(async (s) => {
      try {
        const resData = await api.getReservations(s.id);
        const list = Array.isArray(resData) ? resData : [];
        const seats = list.flatMap(r => Array.isArray(r.seatLabels) ? r.seatLabels : []);
        const uniqueSeats = Array.from(new Set(seats));
        return { id: String(s.id), seats: uniqueSeats };
      } catch (e) {
        return { id: String(s.id), seats: [] };
      }
    })
  );
  const map = new Map(reservationsByScreening.map(x => [x.id, x.seats]));

  tbody.innerHTML = items.map(s => `
    <tr>
      <td>${s.movie}</td>
      <td>${formatStartDE(s.start)}</td>
      <td>${s.hallName || '-'}</td>
      <td>${(map.get(String(s.id)) || []).length || '-'}</td>
    </tr>
  `).join('');
  renderPager('operator-screenings-pagination', data.current, data.total);
}

// ==================== 7. SUB-TABS & FORMS ====================
function setupSubTabs () {
  const formContainer = document.getElementById('operator-forms-container');
  if (formContainer && !document.getElementById('form-tabs')) {
    const tabs = document.createElement('div');
    tabs.id = 'form-tabs';
    tabs.className = 'sub-tabs';
    tabs.innerHTML = `
      <button class="btn-sub active" onclick="switchForm('hall')">Saal anlegen</button>
      <button class="btn-sub" onclick="switchForm('scr')">Vorstellung anlegen</button>
    `;
    formContainer.insertBefore(tabs, formContainer.firstChild);
  }
  const listContainer = document.getElementById('operator-lists-container');
  if (listContainer && !document.getElementById('list-tabs')) {
    const tabs = document.createElement('div');
    tabs.id = 'list-tabs';
    tabs.className = 'sub-tabs';
    tabs.innerHTML = `
      <button class="btn-sub active" onclick="switchList('halls')">Kinosäle</button>
      <button class="btn-sub" onclick="switchList('scrs')">Vorstellungen</button>
    `;
    listContainer.insertBefore(tabs, listContainer.firstChild);
  }
}

window.switchForm = (type) => {
  const cards = document.querySelectorAll('#operator-forms-container .card');
  const hallCard = cards[0]; const scrCard = cards[1];
  const buttons = document.querySelectorAll('#form-tabs .btn-sub');
  if (type === 'hall') {
    hallCard.classList.remove('hidden'); scrCard.classList.add('hidden');
    buttons[0].classList.add('active'); buttons[1].classList.remove('active');
  } else {
    hallCard.classList.add('hidden'); scrCard.classList.remove('hidden');
    buttons[0].classList.remove('active'); buttons[1].classList.add('active');
    refreshHallSelect();
  }
};

window.switchList = (type) => {
  const cards = document.querySelectorAll('#operator-lists-container .card');
  const hallsCard = cards[0]; const scrsCard = cards[1];
  const buttons = document.querySelectorAll('#list-tabs .btn-sub');

  // Reset pagination when switching tabs
  pages.halls = 1;
  pages.screenings = 1;

  if (type === 'halls') {
    hallsCard.classList.remove('hidden'); scrsCard.classList.add('hidden');
    buttons[0].classList.add('active'); buttons[1].classList.remove('active');
    setTimeout(() => renderHalls(), 50);
  } else {
    hallsCard.classList.add('hidden'); scrsCard.classList.remove('hidden');
    buttons[0].classList.remove('active'); buttons[1].classList.add('active');
    setTimeout(() => renderOpScreenings(), 50);
  }
};

// ==================== 8. CUSTOMER FLOW & BOOTSTRAP ====================
async function selectScr (s) {
  selectedScreening = s; selectedSeats = [];
  document.getElementById('customer-area-table').classList.add('hidden');
  const introCard = document.getElementById('customer-intro-card');
  if (introCard) introCard.classList.add('hidden');

  document.getElementById('selected-screening-card').classList.remove('hidden');
  document.getElementById('seat-selection-card').classList.remove('hidden');
  document.getElementById('selected-movie').innerText = s.movie;
  document.getElementById('selected-time').innerText = formatStartDE(s.start);
  document.getElementById('selected-hall').innerText = s.hallName || '-';
  document.getElementById('selected-seats-count').innerText = '0';
  document.getElementById('select-seats-btn').disabled = true;
  document.getElementById('select-seats-btn').innerHTML = '<i class="fas fa-check"></i> Weiter zur Reservierung';

  const allHalls = await fetchAllHalls();
  const hall = allHalls.find(h => h.name === s.hallName) || { rows: 5, seatsPerRow: 8 };
  const resData = await api.getReservations(s.id);
  const taken = (Array.isArray(resData) ? resData : []).flatMap(r => r.seatLabels || []);
  const grid = document.getElementById('seat-grid');
  grid.style.gridTemplateColumns = `repeat(${hall.seatsPerRow}, 1fr)`;
  grid.innerHTML = '';

  for (let r = 1; r <= hall.rows; r++) {
    for (let c = 1; c <= hall.seatsPerRow; c++) {
      const label = String.fromCharCode(64 + r) + c;
      const isTaken = taken.includes(label);
      const seat = document.createElement('div');
      seat.className = `seat ${isTaken ? 'taken' : ''}`;
      seat.innerText = label;
      if (!isTaken) {
        seat.onclick = () => {
          if (selectedSeats.includes(label)) {
            selectedSeats = selectedSeats.filter(x => x !== label);
            seat.classList.remove('selected');
          } else {
            selectedSeats.push(label);
            seat.classList.add('selected');
          }
          document.getElementById('selected-seats-count').innerText = String(selectedSeats.length);
          const btn = document.getElementById('select-seats-btn');
          btn.innerHTML = `<i class="fas fa-check"></i> Weiter zur Reservierung (${selectedSeats.length})`;
          btn.disabled = selectedSeats.length === 0;
        };
      }
      grid.appendChild(seat);
    }
  }
}

function resetToCustomerList () {
  selectedScreening = null; selectedSeats = [];
  document.getElementById('selected-screening-card').classList.add('hidden');
  document.getElementById('seat-selection-card').classList.add('hidden');
  document.getElementById('reservation-form-card').classList.add('hidden');
  document.getElementById('qr-code-card').classList.add('hidden');
  const introCard = document.getElementById('customer-intro-card');
  if (introCard) introCard.classList.remove('hidden');
  document.getElementById('customer-area-table').classList.remove('hidden');
  renderCustomer();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('continue-btn').onclick = () => {
    const roleEl = document.querySelector('input[name="role"]:checked');
    if (!roleEl) return alert('Bitte wählen Sie eine Rolle.');
    document.getElementById('role-selection').classList.remove('active');
    document.getElementById('role-switch-btn').classList.remove('hidden');
    if (roleEl.value === 'betreiber') {
      document.getElementById('operator-area').classList.add('active');
      setupSubTabs();
      document.getElementById('tab-btn-forms').click();
      window.switchForm('hall');
      refreshHallSelect();
    } else {
      document.getElementById('customer-area').classList.add('active');
      renderCustomer();
    }
  };

  document.getElementById('tab-btn-forms').onclick = function () {
    this.classList.add('active'); document.getElementById('tab-btn-lists').classList.remove('active');
    document.getElementById('operator-forms-container').classList.remove('hidden');
    document.getElementById('operator-lists-container').classList.add('hidden');
  };
  document.getElementById('tab-btn-lists').onclick = function () {
    this.classList.add('active'); document.getElementById('tab-btn-forms').classList.remove('active');
    document.getElementById('operator-forms-container').classList.add('hidden');
    document.getElementById('operator-lists-container').classList.remove('hidden');
    setTimeout(() => window.switchList('halls'), 50);
  };
  document.getElementById('role-switch-btn').onclick = () => location.reload();

  document.getElementById('create-hall-form').onsubmit = async (e) => {
    e.preventDefault();
    await api.post('halls', { name: document.getElementById('hall-name').value, rows: document.getElementById('hall-rows').value, seatsPerRow: document.getElementById('hall-seats').value });
    alert('Saal erstellt!'); refreshHallSelect(); e.target.reset();
  };
  document.getElementById('create-screening-form').onsubmit = async (e) => {
    e.preventDefault();
    await api.post('screenings', { hallId: document.getElementById('screening-hall').value, movie: document.getElementById('screening-movie').value, start: `${document.getElementById('screening-date').value}T${document.getElementById('screening-time').value}` });
    alert('Vorstellung erstellt!'); e.target.reset();
    if (!document.getElementById('operator-lists-container').classList.contains('hidden')) renderOpScreenings();
  };

  document.getElementById('select-seats-btn').onclick = () => {
    document.getElementById('seat-selection-card').classList.add('hidden');
    document.getElementById('reservation-form-card').classList.remove('hidden');
    document.getElementById('summary-movie').innerText = selectedScreening.movie;
    document.getElementById('summary-time').innerText = formatStartDE(selectedScreening.start);
    document.getElementById('summary-hall').innerText = selectedScreening.hallName;
    document.getElementById('summary-seats').innerText = selectedSeats.join(', ');
  };
  document.getElementById('cancel-seat-selection-btn').onclick = resetToCustomerList;
  document.getElementById('cancel-reservation-btn').onclick = resetToCustomerList;

  document.getElementById('reservation-form').onsubmit = async (e) => {
    e.preventDefault();
    const customerName = document.getElementById('customer-name').value;
    const res = await api.createReservation({ screeningId: selectedScreening.id, customerName, seatLabels: selectedSeats });

    document.getElementById('reservation-form-card').classList.add('hidden');
    document.getElementById('qr-code-card').classList.remove('hidden');

    const qrText = `KINO-RESERVIERUNG
ID: ${res.id}
Film: ${selectedScreening.movie}
Zeit: ${formatStartDE(selectedScreening.start)}
Saal: ${selectedScreening.hallName}
Sitze: ${selectedSeats.join(', ')}
Kunde: ${customerName}`;

    setTimeout(() => {
      const qrContainer = document.getElementById('real-qr');
      qrContainer.innerHTML = '<canvas></canvas>'; // Wir erstellen eine leere Leinwand

      QRCode.toCanvas(qrContainer.querySelector('canvas'), qrText, {
        width: 200,
        margin: 1
      }, function (error) {
        if (error) console.error(error);
      });
    }, 150);
  };
  document.getElementById('print-qr-btn').onclick = () => window.print();
  document.getElementById('new-reservation-btn').onclick = resetToCustomerList;

  // DYNAMIC RESIZE: Triggers re-render to adjust row count automatically
  let resizeTimer;
  window.onresize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('customer-area').classList.contains('active')) renderCustomer();
      else if (document.getElementById('operator-area').classList.contains('active')) {
        if (!document.getElementById('operator-lists-container').classList.contains('hidden')) {
          renderHalls(); renderOpScreenings();
        }
      }
    }, 200);
  };

  // Logic for handling the header visibility
  const customerList = document.getElementById('customer-screenings-list');
  const introCard = document.getElementById('customer-intro-card');
  const cancelBtn = document.getElementById('cancel-seat-selection-btn');
  const cancelResBtn = document.getElementById('cancel-reservation-btn');
  const newResBtn = document.getElementById('new-reservation-btn');

  // 1. Hide Header when a Reserve button is clicked in the table
  if (customerList) {
    customerList.addEventListener('click', (e) => {
      // Check if the clicked element is a button or inside a button
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        if (introCard) introCard.classList.add('hidden');
      }
    });
  }

  // 2. Show Header again if user cancels or starts over
  const showHeader = () => {
    if (introCard) introCard.classList.remove('hidden');
  };

  if (cancelBtn) cancelBtn.addEventListener('click', showHeader);
  if (cancelResBtn) cancelResBtn.addEventListener('click', showHeader);
  if (newResBtn) newResBtn.addEventListener('click', showHeader);
});
