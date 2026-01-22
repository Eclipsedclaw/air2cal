// script.js
// Uses Luxon (loaded in index.html via CDN)
const DateTime = luxon.DateTime;

/* Airport map (same data as your main.py). Trimmed for brevity but extendable. */
const AIRPORTS = {
  "JFK": {"tz":"America/New_York","name":"John F Kennedy International Airport","city":"New York","country":"US"},
  "KIX": {"tz":"Asia/Tokyo","name":"Kansai International Airport","city":"Osaka","country":"JP"},
  "HNL": {"tz":"Pacific/Honolulu","name":"Daniel K Inouye International Airport","city":"Honolulu","country":"US"},
  "LAX": {"tz":"America/Los_Angeles","name":"Los Angeles International Airport","city":"Los Angeles","country":"US"},
  "SFO": {"tz":"America/Los_Angeles","name":"San Francisco International Airport","city":"San Francisco","country":"US"},
  "NRT": {"tz":"Asia/Tokyo","name":"Narita International Airport","city":"Tokyo","country":"JP"},
  "HND": {"tz":"Asia/Tokyo","name":"Haneda Airport","city":"Tokyo","country":"JP"},
  "ORD": {"tz":"America/Chicago","name":"O'Hare International Airport","city":"Chicago","country":"US"},
  "SEA": {"tz":"America/Los_Angeles","name":"Seattle-Tacoma International Airport","city":"Seattle","country":"US"},
  "MIA": {"tz":"America/New_York","name":"Miami International Airport","city":"Miami","country":"US"},
  "BOS": {"tz":"America/New_York","name":"Logan International Airport","city":"Boston","country":"US"},
  // Add more entries from your Python list as needed...
};

// State
let flights = [];
let editingIndex = null; // null = adding new, number = editing existing

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const flightForm = document.getElementById('flightForm');
const modalTitle = document.getElementById('modalTitle');

// Form fields
const fld = {
  flight_number: document.getElementById('flight_number'),
  passenger_name: document.getElementById('passenger_name'),
  departure_airport: document.getElementById('departure_airport'),
  departure_timezone: document.getElementById('departure_timezone'),
  departure_time: document.getElementById('departure_time'),
  arrival_airport: document.getElementById('arrival_airport'),
  arrival_timezone: document.getElementById('arrival_timezone'),
  arrival_time: document.getElementById('arrival_time'),
  seat: document.getElementById('seat'),
  class: document.getElementById('class'),
  baggage: document.getElementById('baggage'),
};

// Open modal to add new flight
document.getElementById('addFlight').addEventListener('click', () => openModalForNew());

// Cancel modal
document.getElementById('cancelFlight').addEventListener('click', () => closeModal());

// Save handlers
document.getElementById('saveFlight').addEventListener('click', () => saveFlight(false));
document.getElementById('saveAndAddAnother').addEventListener('click', () => saveFlight(true));

// Generate ICS
document.getElementById('generate').addEventListener('click', () => {
  try {
    if (flights.length === 0) throw new Error('No flights to export. Add at least one flight.');
    const ics = buildICS(flights);
    const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const ts = DateTime.utc().toFormat("yyyyLLdd_HHmmss");
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = `flights_${ts}.ics`;
    link.style.display = 'inline-block';
    link.textContent = `Download flights_${ts}.ics`;
    link.click();
  } catch (err) {
    alert(err.message);
    console.error(err);
  }
});

// Auto-fill timezone when airport input loses focus or reaches 3 chars
[fld.departure_airport, fld.arrival_airport].forEach(input => {
  input.addEventListener('blur', (e) => tryAutoFillTz(e.target));
  input.addEventListener('input', (e) => {
    const v = e.target.value.trim().toUpperCase();
    if (v.length === 3) tryAutoFillTz(e.target);
  });
});

function tryAutoFillTz(inputEl) {
  const code = inputEl.value.trim().toUpperCase();
  if (!code) return;
  const tzField = inputEl === fld.departure_airport ? fld.departure_timezone : fld.arrival_timezone;
  if (AIRPORTS[code]) tzField.value = AIRPORTS[code].tz || '';
}

function openModalForNew() {
  editingIndex = null;
  modalTitle.textContent = 'Add Flight';
  flightForm.reset();
  fld.departure_timezone.value = '';
  fld.arrival_timezone.value = '';
  showModal();
}

function openModalForEdit(idx) {
  editingIndex = idx;
  const f = flights[idx];
  modalTitle.textContent = 'Edit Flight';
  fld.flight_number.value = f.flight_number || '';
  fld.passenger_name.value = f.passenger_name || '';
  fld.departure_airport.value = f.departure_airport || '';
  fld.departure_timezone.value = f.departure_timezone || '';
  fld.departure_time.value = f.departure_time || '';
  fld.arrival_airport.value = f.arrival_airport || '';
  fld.arrival_timezone.value = f.arrival_timezone || '';
  fld.arrival_time.value = f.arrival_time || '';
  fld.seat.value = f.seat || '';
  fld.class.value = f.class || '';
  fld.baggage.value = f.baggage || '';
  showModal();
}

function showModal() {
  modalOverlay.style.display = 'flex';
  modalOverlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modalOverlay.style.display = 'none';
  modalOverlay.setAttribute('aria-hidden', 'true');
  editingIndex = null;
}

// Validate & save
function saveFlight(keepOpen) {
  // Read fields
  const flight_number = fld.flight_number.value.trim() || '(unknown)';
  const passenger_name = fld.passenger_name.value.trim() || '(unknown)';
  const departure_airport = fld.departure_airport.value.trim().toUpperCase();
  let departure_timezone = fld.departure_timezone.value.trim();
  const departure_time = fld.departure_time.value.trim();
  const arrival_airport = fld.arrival_airport.value.trim().toUpperCase();
  let arrival_timezone = fld.arrival_timezone.value.trim();
  const arrival_time = fld.arrival_time.value.trim();
  const seat = fld.seat.value.trim();
  const flight_class = fld.class.value.trim();
  const baggage = fld.baggage.value.trim();

  // Auto-fill tz from map if empty
  if (!departure_timezone && AIRPORTS[departure_airport]) departure_timezone = AIRPORTS[departure_airport].tz || '';
  if (!arrival_timezone && AIRPORTS[arrival_airport]) arrival_timezone = AIRPORTS[arrival_airport].tz || '';

  // Basic validation: require airport codes and datetimes
  if (!departure_airport || !departure_time) { alert('Please provide departure airport and date/time.'); return; }
  if (!arrival_airport || !arrival_time) { alert('Please provide arrival airport and date/time.'); return; }

  // Validate date/time parsing with Luxon
  const dtDep = DateTime.fromFormat(departure_time, 'yyyy-LL-dd HH:mm', {zone: departure_timezone || 'UTC'});
  const dtArr = DateTime.fromFormat(arrival_time, 'yyyy-LL-dd HH:mm', {zone: arrival_timezone || 'UTC'});
  if (!dtDep.isValid) { alert('Departure date/time is invalid. Use YYYY-MM-DD HH:MM'); return; }
  if (!dtArr.isValid) { alert('Arrival date/time is invalid. Use YYYY-MM-DD HH:MM'); return; }

  const flight = {
    flight_number, passenger_name,
    departure_airport, departure_timezone: departure_timezone || 'UTC', departure_time,
    arrival_airport, arrival_timezone: arrival_timezone || 'UTC', arrival_time,
    seat, class: flight_class, baggage
  };

  if (editingIndex === null) {
    flights.push(flight);
  } else {
    flights[editingIndex] = flight;
  }

  renderFlights();
  if (!keepOpen) closeModal();
  else {
    // reset form for next entry
    flightForm.reset();
    fld.departure_timezone.value = '';
    fld.arrival_timezone.value = '';
  }
}

// Render flight summaries list
function renderFlights() {
  const container = document.getElementById('flights');
  container.innerHTML = '';
  flights.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'flight-summary';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const depDisplay = `${f.departure_airport} ${f.departure_time} (${f.departure_timezone})`;
    const arrDisplay = `${f.arrival_airport} ${f.arrival_time} (${f.arrival_timezone})`;
    meta.innerHTML = `<strong>${escapeHtml(f.flight_number)}</strong> — ${escapeHtml(f.passenger_name)}<br>
                      🛫 ${escapeHtml(depDisplay)}<br>
                      🛬 ${escapeHtml(arrDisplay)}<br>
                      <small>Seat: ${escapeHtml(f.seat || 'Not assigned')} • Class: ${escapeHtml(f.class || 'Not specified')} • Baggage: ${escapeHtml(f.baggage || 'Not specified')}</small>`;

    const actions = document.createElement('div');
    actions.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModalForEdit(i));
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Remove';
    delBtn.className = 'danger';
    delBtn.addEventListener('click', () => {
      if (confirm('Remove this flight?')) {
        flights.splice(i, 1);
        renderFlights();
      }
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(meta);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

// Build ICS content (UTC timestamps)
function buildICS(flightsArr) {
  const nowUTC = DateTime.utc().toFormat("yyyyLLdd'T'HHmmss'Z'");
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Air2Cal static generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n') + '\r\n';

  for (const f of flightsArr) {
    const dtstart = DateTime.fromFormat(f.departure_time, 'yyyy-LL-dd HH:mm', {zone: f.departure_timezone}).toUTC();
    const dtend = DateTime.fromFormat(f.arrival_time, 'yyyy-LL-dd HH:mm', {zone: f.arrival_timezone}).toUTC();
    if (!dtstart.isValid || !dtend.isValid) throw new Error(`Invalid date/time for flight ${f.flight_number}`);

    const dtstartStr = dtstart.toFormat("yyyyLLdd'T'HHmmss'Z'");
    const dtendStr = dtend.toFormat("yyyyLLdd'T'HHmmss'Z'");
    const uid = `flight-${f.flight_number.replace(/\s+/g,'-')}-${dtstartStr}-${Math.floor(Math.random()*10000)}@air2cal`;
    const summary = `✈️ ${f.flight_number} ${f.departure_airport} → ${f.arrival_airport}`;
    const description = [
      `Flight: ${f.flight_number}`,
      `Passenger: ${f.passenger_name}`,
      `Depart: ${f.departure_time} (${f.departure_timezone})`,
      `Arrive: ${f.arrival_time} (${f.arrival_timezone})`,
      `Duration: ${formatDuration(dtstart, dtend)}`,
      `Seat: ${f.seat || 'Not assigned'}`,
      `Class: ${f.class || 'Not specified'}`,
      `Baggage: ${f.baggage || 'Not specified'}`
    ].join('\n');

    const event = [
      'BEGIN:VEVENT',
      `UID:${icsEscape(uid)}`,
      `DTSTAMP:${nowUTC}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DTSTART:${dtstartStr}`,
      `DTEND:${dtendStr}`,
      `LOCATION:${icsEscape(f.departure_airport)} → ${icsEscape(f.arrival_airport)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';

    ics += event;
  }

  ics += 'END:VCALENDAR\r\n';
  return ics;
}

// Helpers
function icsEscape(text) {
  return (text||'').toString().replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}
function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatDuration(startDt, endDt){
  const diff = endDt.diff(startDt, ['hours','minutes']).toObject();
  const hours = Math.floor(diff.hours || 0);
  const minutes = Math.round(diff.minutes || 0);
  if (hours>0 && minutes>0) return `${hours}h ${minutes}m`;
  if (hours>0) return `${hours}h`;
  return `${minutes}m`;
}

// Close modal when clicking outside modal content
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Initialize (shows no flights initially)
renderFlights();