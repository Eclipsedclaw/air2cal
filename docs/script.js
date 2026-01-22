// script.js
// Uses Luxon (loaded in index.html via CDN)
// Loads docs/airports.json at runtime and provides autocomplete + timezone autofill.

const DateTime = luxon.DateTime;

// small fallback subset while full airports.json loads
let AIRPORTS = {
  "JFK": {"tz":"America/New_York","name":"John F. Kennedy International Airport","city":"New York","country":"US"},
  "LAX": {"tz":"America/Los_Angeles","name":"Los Angeles International Airport","city":"Los Angeles","country":"US"},
  "HND": {"tz":"Asia/Tokyo","name":"Haneda Airport","city":"Tokyo","country":"JP"}
};

// Load airports.json (non-blocking). Caches in localStorage if available.
async function loadAirportsJson(options = {useLocalStorage: true}) {
  if (options.useLocalStorage) {
    try {
      const cached = localStorage.getItem('airports_json_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          AIRPORTS = {};
          for (const [k, v] of Object.entries(parsed)) AIRPORTS[k.toUpperCase()] = v;
          console.log(`Loaded ${Object.keys(AIRPORTS).length} airports from localStorage cache`);
        }
      }
    } catch (e) {
      console.warn('Could not read airports cache:', e);
    }
  }

  try {
    // airports.json should be placed next to index.html in the published site
    const url = new URL('airports.json', location.href).toString();
    const resp = await fetch(url, {cache: 'no-cache'});
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const normalized = {};
    for (const [code, info] of Object.entries(data)) {
      normalized[code.toUpperCase()] = info;
    }
    AIRPORTS = normalized;
    console.log(`Loaded ${Object.keys(AIRPORTS).length} airports from airports.json`);

    // populate datalist for autocomplete
    fillAirportDatalist();

    if (options.useLocalStorage) {
      try {
        localStorage.setItem('airports_json_v1', JSON.stringify(normalized));
      } catch (e) {
        console.warn('Could not cache airports.json to localStorage:', e);
      }
    }
    return true;
  } catch (err) {
    console.warn('Could not load airports.json; using fallback AIRPORTS:', err);
    // still populate datalist from fallback
    fillAirportDatalist();
    return false;
  }
}

// fill datalist with entries like "JFK — New York (John F. Kennedy...)"
function fillAirportDatalist() {
  const datalist = document.getElementById('airportList');
  if (!datalist) return;
  datalist.innerHTML = '';
  const entries = Object.entries(AIRPORTS);
  // limit to first ~100 for datalist size (or leave more)
  const limit = Math.min(entries.length, 120);
  for (let i = 0; i < limit; i++) {
    const [code, info] = entries[i];
    const opt = document.createElement('option');
    const city = info.city || '';
    const name = info.name || '';
    opt.value = `${code} — ${city}${name ? ` (${name})` : ''}`;
    datalist.appendChild(opt);
  }
}

// Utilities to extract IATA code from user input (accepts "JFK" or "JFK — New York")
function extractCode(input) {
  if (!input) return '';
  const trimmed = input.trim();
  // If starts with three letters (or 3-4) use them
  const m = trimmed.match(/^([A-Za-z]{3,4})\b/);
  if (m) return m[1].toUpperCase();
  // If contains ' — ' pattern, split
  if (trimmed.includes('—')) {
    return trimmed.split('—')[0].trim().toUpperCase();
  }
  // fallback: last token if it is code-like
  const tokens = trimmed.split(/\s+/);
  const last = tokens[0] || '';
  if (/^[A-Za-z]{3,4}$/.test(last)) return last.toUpperCase();
  return trimmed.toUpperCase();
}

// Round DateTime to nearest step (15 min)
function roundToStep(dateTime, stepMinutes = 15) {
  const totalMinutes = dateTime.hour * 60 + dateTime.minute;
  const rounded = Math.round(totalMinutes / stepMinutes) * stepMinutes;
  const hh = String(Math.floor((rounded / 60) % 24)).padStart(2, '0');
  const mm = String(rounded % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // initialize loading airports.json in background
  loadAirportsJson().catch(() => {});

  // State
  let flights = [];
  let editingIndex = null;

  // Elements
  const modalOverlay = document.getElementById('modalOverlay');
  const flightForm = document.getElementById('flightForm');
  const modalTitle = document.getElementById('modalTitle');

  const fld = {
    flight_number: document.getElementById('flight_number'),
    passenger_name: document.getElementById('passenger_name'),
    departure_airport: document.getElementById('departure_airport'),
    departure_timezone: document.getElementById('departure_timezone'),
    departure_date: document.getElementById('departure_date'),
    departure_time: document.getElementById('departure_time'),
    arrival_airport: document.getElementById('arrival_airport'),
    arrival_timezone: document.getElementById('arrival_timezone'),
    arrival_date: document.getElementById('arrival_date'),
    arrival_time: document.getElementById('arrival_time'),
    seat: document.getElementById('seat'),
    class: document.getElementById('class'),
    baggage: document.getElementById('baggage'),
  };

  // Wire UI buttons
  document.getElementById('addFlight').addEventListener('click', openModalForNew);
  document.getElementById('cancelFlight').addEventListener('click', closeModal);
  document.getElementById('saveFlight').addEventListener('click', () => saveFlight(false));
  document.getElementById('saveAndAddAnother').addEventListener('click', () => saveFlight(true));
  document.getElementById('generate').addEventListener('click', generateIcs);

  // Autofill tz when airport input changes/loses focus
  [fld.departure_airport, fld.arrival_airport].forEach(input => {
    input.addEventListener('blur', (e) => tryAutoFillTz(e.target));
    input.addEventListener('input', (e) => {
      const v = e.target.value.trim();
      // try autofill when user types code at start or picks from datalist
      const code = extractCode(v);
      if (code && AIRPORTS[code]) tryAutoFillTz(e.target);
    });
  });

  function tryAutoFillTz(inputEl) {
    const raw = inputEl.value || '';
    const code = extractCode(raw);
    if (!code) return;
    const tzField = inputEl === fld.departure_airport ? fld.departure_timezone : fld.arrival_timezone;
    if (AIRPORTS[code]) tzField.value = AIRPORTS[code].tz || '';
  }

  // Modal functions
  function openModalForNew() {
    editingIndex = null;
    modalTitle.textContent = 'Add Flight';
    flightForm.reset();
    fld.departure_timezone.value = '';
    fld.arrival_timezone.value = '';
    const today = DateTime.now().toISODate();
    fld.departure_date.value = today;
    fld.arrival_date.value = today;
    const roundedNow = roundToStep(DateTime.now(), 15);
    fld.departure_time.value = roundedNow;
    fld.arrival_time.value = roundedNow;
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
    fld.departure_date.value = f.departure_date || '';
    fld.departure_time.value = f.departure_time || '00:00';
    fld.arrival_airport.value = f.arrival_airport || '';
    fld.arrival_timezone.value = f.arrival_timezone || '';
    fld.arrival_date.value = f.arrival_date || '';
    fld.arrival_time.value = f.arrival_time || '00:00';
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

  // Save/validate flight
  function saveFlight(keepOpen) {
    const flight_number = fld.flight_number.value.trim() || '(unknown)';
    const passenger_name = fld.passenger_name.value.trim() || '(unknown)';
    const departure_airport_raw = fld.departure_airport.value.trim();
    const departure_airport = extractCode(departure_airport_raw);
    let departure_timezone = fld.departure_timezone.value.trim();
    const departure_date = fld.departure_date.value;
    const departure_time = fld.departure_time.value;

    const arrival_airport_raw = fld.arrival_airport.value.trim();
    const arrival_airport = extractCode(arrival_airport_raw);
    let arrival_timezone = fld.arrival_timezone.value.trim();
    const arrival_date = fld.arrival_date.value;
    const arrival_time = fld.arrival_time.value;

    const seat = fld.seat.value.trim();
    const flight_class = fld.class.value.trim();
    const baggage = fld.baggage.value.trim();

    // autofill tz if missing
    if (!departure_timezone && AIRPORTS[departure_airport]) departure_timezone = AIRPORTS[departure_airport].tz || '';
    if (!arrival_timezone && AIRPORTS[arrival_airport]) arrival_timezone = AIRPORTS[arrival_airport].tz || '';

    if (!departure_airport || !departure_date || !departure_time) { alert('Please provide departure airport, date and time.'); return; }
    if (!arrival_airport || !arrival_date || !arrival_time) { alert('Please provide arrival airport, date and time.'); return; }

    const depCombined = `${departure_date} ${departure_time}`;
    const arrCombined = `${arrival_date} ${arrival_time}`;

    const dtDep = DateTime.fromFormat(depCombined, 'yyyy-LL-dd HH:mm', {zone: departure_timezone || 'UTC'});
    const dtArr = DateTime.fromFormat(arrCombined, 'yyyy-LL-dd HH:mm', {zone: arrival_timezone || 'UTC'});
    if (!dtDep.isValid) { alert('Departure date/time is invalid.'); return; }
    if (!dtArr.isValid) { alert('Arrival date/time is invalid.'); return; }

    const flight = {
      flight_number, passenger_name,
      departure_airport, departure_timezone: departure_timezone || 'UTC',
      departure_date, departure_time,
      arrival_airport, arrival_timezone: arrival_timezone || 'UTC',
      arrival_date, arrival_time,
      seat, class: flight_class, baggage,
      departure_time_combined: depCombined,
      arrival_time_combined: arrCombined
    };

    if (editingIndex === null) flights.push(flight);
    else flights[editingIndex] = flight;

    renderFlights();
    if (!keepOpen) closeModal();
    else {
      flightForm.reset();
      fld.departure_timezone.value = '';
      fld.arrival_timezone.value = '';
      const today = DateTime.now().toISODate();
      fld.departure_date.value = today;
      fld.arrival_date.value = today;
      const roundedNow = roundToStep(DateTime.now(), 15);
      fld.departure_time.value = roundedNow;
      fld.arrival_time.value = roundedNow;
    }
  }

  // render flight list
  function renderFlights() {
    const container = document.getElementById('flights');
    container.innerHTML = '';
    flights.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'flight-summary';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const depDisplay = `${f.departure_airport} ${f.departure_date} ${f.departure_time} (${f.departure_timezone})`;
      const arrDisplay = `${f.arrival_airport} ${f.arrival_date} ${f.arrival_time} (${f.arrival_timezone})`;
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

  // build ICS and trigger download
  function generateIcs() {
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
  }

  // Build ICS (UTC times)
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
      const depCombined = `${f.departure_date} ${f.departure_time}`;
      const arrCombined = `${f.arrival_date} ${f.arrival_time}`;

      const dtstart = DateTime.fromFormat(depCombined, 'yyyy-LL-dd HH:mm', {zone: f.departure_timezone}).toUTC();
      const dtend = DateTime.fromFormat(arrCombined, 'yyyy-LL-dd HH:mm', {zone: f.arrival_timezone}).toUTC();
      if (!dtstart.isValid || !dtend.isValid) throw new Error(`Invalid date/time for flight ${f.flight_number}`);

      const dtstartStr = dtstart.toFormat("yyyyLLdd'T'HHmmss'Z'");
      const dtendStr = dtend.toFormat("yyyyLLdd'T'HHmmss'Z'");
      const uid = `flight-${f.flight_number.replace(/\s+/g,'-')}-${dtstartStr}-${Math.floor(Math.random()*10000)}@air2cal`;
      const summary = `✈️ ${f.flight_number} ${f.departure_airport} → ${f.arrival_airport}`;
      const description = [
        `Flight: ${f.flight_number}`,
        `Passenger: ${f.passenger_name}`,
        `Depart: ${depCombined} (${f.departure_timezone})`,
        `Arrive: ${arrCombined} (${f.arrival_timezone})`,
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

  /* Helpers */

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

  // close modal when clicking outside modal content
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // init UI render
  renderFlights();
});