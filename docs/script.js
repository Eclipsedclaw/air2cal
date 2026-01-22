// script.js
// Uses Luxon (loaded in index.html via CDN) and Fuse.js for fuzzy search
const DateTime = luxon.DateTime;

/*
  This script loads docs/airports.json (if available), builds a Fuse index
  and provides suggestion dropdowns for airport inputs (code, city, name).
*/

// Small fallback if airports.json cannot be loaded
let AIRPORTS = {
  "JFK": {"tz":"America/New_York","name":"John F. Kennedy International Airport","city":"New York","country":"US"},
  "LAX": {"tz":"America/Los_Angeles","name":"Los Angeles International Airport","city":"Los Angeles","country":"US"},
  "HND": {"tz":"Asia/Tokyo","name":"Haneda Airport","city":"Tokyo","country":"JP"}
};

let FUSE = null;
let FUSE_LIST = []; // array of {code,name,city,tz}

// Load airports.json into AIRPORTS and init fuse
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
    const url = new URL('airports.json', location.href).toString();
    const resp = await fetch(url, {cache: 'no-cache'});
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const normalized = {};
    for (const [code, info] of Object.entries(data)) normalized[code.toUpperCase()] = info;
    AIRPORTS = normalized;
    console.log(`Loaded ${Object.keys(AIRPORTS).length} airports from airports.json`);
    try { localStorage.setItem('airports_json_v1', JSON.stringify(normalized)); } catch(e){}
  } catch (err) {
    console.warn('Could not load airports.json; using fallback AIRPORTS:', err);
  }

  initFuse();
}

// Prepare Fuse.js index
function initFuse() {
  FUSE_LIST = Object.entries(AIRPORTS).map(([code, info]) => ({
    code,
    name: info.name || '',
    city: info.city || '',
    tz: info.tz || ''
  }));

  // Configure Fuse: search code (exact/startsWith) and fuzzy on name/city
  const options = {
    includeScore: true,
    shouldSort: true,
    threshold: 0.35, // smaller threshold = stricter match (tweakable)
    keys: [
      { name: 'code', weight: 0.6 },
      { name: 'name', weight: 0.3 },
      { name: 'city', weight: 0.3 }
    ],
    useExtendedSearch: true
  };

  try {
    FUSE = new Fuse(FUSE_LIST, options);
  } catch (e) {
    console.warn('Fuse initialization failed; suggestions disabled', e);
    FUSE = null;
  }
}

// Utility: extract code if user typed "JFK — New York" or just "JFK"
function extractCode(input) {
  if (!input) return '';
  const s = input.trim();
  // pattern: "JFK — ..." or "JFK - ..." or starts with code
  const m = s.match(/^([A-Za-z]{3,4})\b/);
  if (m) return m[1].toUpperCase();
  if (s.includes('—')) return s.split('—')[0].trim().toUpperCase();
  if (s.includes('-')) return s.split('-')[0].trim().toUpperCase();
  return s.toUpperCase();
}

// Suggestion UI: create and attach handlers for a given input and suggestion container
function attachSuggestions(inputEl, suggContainer) {
  let activeIndex = -1;
  let currentItems = [];
  const debounce = (fn, wait) => {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  function showSuggestions(items) {
    currentItems = items;
    activeIndex = -1;
    suggContainer.innerHTML = '';
    if (!items || items.length === 0) {
      suggContainer.setAttribute('aria-hidden', 'true');
      return;
    }
    items.forEach((it, idx) => {
      const el = document.createElement('div');
      el.className = 'suggestion';
      el.setAttribute('role', 'option');
      el.dataset.index = idx;
      el.innerHTML = `<span class="code">${escapeHtml(it.code)}</span>
                      <span class="meta">${escapeHtml(it.city || '')}${it.city ? ' — ' : ''}${escapeHtml(it.name || '')}</span>`;
      el.addEventListener('mousedown', (e) => {
        // use mousedown so input doesn't lose focus before click
        e.preventDefault();
        selectSuggestion(idx);
      });
      suggContainer.appendChild(el);
    });
    suggContainer.setAttribute('aria-hidden', 'false');
  }

  function hideSuggestions() {
    suggContainer.setAttribute('aria-hidden', 'true');
    currentItems = [];
    activeIndex = -1;
  }

  function selectSuggestion(idx) {
    const it = currentItems[idx];
    if (!it) return;
    inputEl.value = `${it.code} — ${it.city}${it.name ? ` (${it.name})` : ''}`;
    // trigger timezone autofill
    const tzField = inputEl.id.includes('departure') ? document.getElementById('departure_timezone') : document.getElementById('arrival_timezone');
    if (tzField && it.tz) tzField.value = it.tz;
    hideSuggestions();
    inputEl.focus();
  }

  function onInput() {
    const q = inputEl.value.trim();
    if (!q) { hideSuggestions(); return; }
    // First, if q looks like an exact code, show that as top result
    const codeCandidate = extractCode(q);
    const exact = AIRPORTS[codeCandidate];
    let results = [];
    if (exact) {
      results.push({ code: codeCandidate, name: exact.name, city: exact.city, tz: exact.tz });
    }
    // Fuse search for other matches
    if (FUSE && q.length >= 1) {
      const fuseResults = FUSE.search(q, {limit: 10});
      for (const r of fuseResults) {
        const item = r.item;
        if (item.code === codeCandidate) continue;
        results.push(item);
        if (results.length >= 8) break;
      }
    } else {
      const lowered = q.toLowerCase();
      for (const item of FUSE_LIST) {
        if (item.code.toLowerCase().includes(lowered) || item.name.toLowerCase().includes(lowered) || item.city.toLowerCase().includes(lowered)) {
          if (!results.find(r => r.code === item.code)) results.push(item);
          if (results.length >= 8) break;
        }
      }
    }
    showSuggestions(results);
  }

  const debounced = debounce(onInput, 150);
  inputEl.addEventListener('input', debounced);

  inputEl.addEventListener('keydown', (e) => {
    const items = suggContainer.querySelectorAll('.suggestion');
    if (suggContainer.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive(items);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < currentItems.length) {
        e.preventDefault();
        selectSuggestion(activeIndex);
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  function updateActive(items) {
    items.forEach((el, idx) => {
      el.classList.toggle('active', idx === activeIndex);
    });
    if (activeIndex >= 0 && items[activeIndex]) {
      const el = items[activeIndex];
      el.scrollIntoView({block: 'nearest'});
    }
  }

  // close suggestions when clicking outside
  document.addEventListener('click', (ev) => {
    if (!suggContainer.contains(ev.target) && ev.target !== inputEl) hideSuggestions();
  });
}

// small escape for innerHTML usage
function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// rest of the UI logic (modal, saving, ICS building) follows previous structure
document.addEventListener('DOMContentLoaded', () => {
  // load airports and build fuse index
  loadAirportsJson().catch(() => { initFuse(); });

  // State
  let flights = [];
  let editingIndex = null;

  // Create one default placeholder flight so the UI always shows a first flight input.
  // This placeholder forces the user to edit the first flight before exporting.
  const today = DateTime.now().toISODate();
  const roundedNow = roundToStep(DateTime.now(), 15);
  flights.push({
    placeholder: true,
    flight_number: '(new flight)',
    passenger_name: '(click Edit)',
    departure_airport: '',
    departure_timezone: '',
    departure_date: today,
    departure_time: roundedNow,
    arrival_airport: '',
    arrival_timezone: '',
    arrival_date: today,
    arrival_time: roundedNow,
    seat: '',
    class: '',
    baggage: ''
  });

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

  // Attach suggestion handlers for both airport inputs
  attachSuggestions(fld.departure_airport, document.getElementById('departure_suggestions'));
  attachSuggestions(fld.arrival_airport, document.getElementById('arrival_suggestions'));

  // Wire UI buttons (same as before)
  document.getElementById('addFlight').addEventListener('click', openModalForNew);
  document.getElementById('cancelFlight').addEventListener('click', closeModal);
  document.getElementById('saveFlight').addEventListener('click', () => saveFlight(false));
  document.getElementById('saveAndAddAnother').addEventListener('click', () => saveFlight(true));
  document.getElementById('generate').addEventListener('click', generateIcs);

  // Also autofill tz on blur if user typed only a code
  [fld.departure_airport, fld.arrival_airport].forEach(input => {
    input.addEventListener('blur', (e) => {
      const code = extractCode(e.target.value);
      if (code && AIRPORTS[code]) {
        const tzField = e.target.id.includes('departure') ? fld.departure_timezone : fld.arrival_timezone;
        tzField.value = AIRPORTS[code].tz || '';
      }
    });
  });

  // Modal functions & rest of logic (saveFlight, renderFlights, buildICS, etc.)
  function openModalForNew() {
    // Add new flight entries only start from the second one (first is placeholder)
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
    modalTitle.textContent = f.placeholder ? 'Fill First Flight' : 'Edit Flight';
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

    if (editingIndex === null) {
      // adding new (second+ flights)
      flights.push(flight);
    } else {
      // replacing existing (including the initial placeholder)
      flights[editingIndex] = flight;
    }

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

  function renderFlights() {
    const container = document.getElementById('flights');
    container.innerHTML = '';
    flights.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'flight-summary';

      const meta = document.createElement('div');
      meta.className = 'meta';

      if (f.placeholder) {
        // show instructive placeholder
        meta.innerHTML = `<strong style="opacity:.9">First flight (required)</strong><br>
                          <small style="color:var(--muted)">Click <em>Edit</em> to enter the first flight's details.</small>`;
      } else {
        const depDisplay = `${f.departure_airport} ${f.departure_date} ${f.departure_time} (${f.departure_timezone})`;
        const arrDisplay = `${f.arrival_airport} ${f.arrival_date} ${f.arrival_time} (${f.arrival_timezone})`;
        meta.innerHTML = `<strong>${escapeHtml(f.flight_number)}</strong> — ${escapeHtml(f.passenger_name)}<br>
                          🛫 ${escapeHtml(depDisplay)}<br>
                          🛬 ${escapeHtml(arrDisplay)}<br>
                          <small>Seat: ${escapeHtml(f.seat || 'Not assigned')} • Class: ${escapeHtml(f.class || 'Not specified')} • Baggage: ${escapeHtml(f.baggage || 'Not specified')}</small>`;
      }

      const actions = document.createElement('div');
      actions.className = 'actions';
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openModalForEdit(i));
      actions.appendChild(editBtn);

      // allow removing only non-placeholder flights
      if (!f.placeholder) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove';
        delBtn.className = 'danger';
        delBtn.addEventListener('click', () => {
          if (confirm('Remove this flight?')) {
            flights.splice(i, 1);
            renderFlights();
          }
        });
        actions.appendChild(delBtn);
      }

      item.appendChild(meta);
      item.appendChild(actions);
      container.appendChild(item);
    });
  }

  function generateIcs() {
    try {
      // ensure first placeholder has been filled
      const hasPlaceholder = flights.some(f => f.placeholder === true);
      if (hasPlaceholder) {
        alert('Please fill in the first flight before exporting. Click Edit on the first flight.');
        return;
      }

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

  // Helpers (escape, rounding, etc.)
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
  function roundToStep(dateTime, stepMinutes = 15) {
    const totalMinutes = dateTime.hour * 60 + dateTime.minute;
    const rounded = Math.round(totalMinutes / stepMinutes) * stepMinutes;
    const hh = String(Math.floor((rounded / 60) % 24)).padStart(2, '0');
    const mm = String(rounded % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Close modal clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Initialize UI
  renderFlights();
});