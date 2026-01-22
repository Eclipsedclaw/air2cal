// script.js
// Uses Luxon (loaded in index.html via CDN)
const DateTime = luxon.DateTime;

/*
  Built-in airport database (timezone + metadata) ported from your main.py
  Keys are IATA codes (uppercase). You can extend this map if desired.
*/
const AIRPORTS = {
  "JFK": {"tz":"America/New_York","name":"John F Kennedy International Airport","city":"New York","country":"US"},
  "LGA": {"tz":"America/New_York","name":"LaGuardia Airport","city":"New York","country":"US"},
  "EWR": {"tz":"America/New_York","name":"Newark Liberty International Airport","city":"Newark","country":"US"},
  "BOS": {"tz":"America/New_York","name":"Logan International Airport","city":"Boston","country":"US"},
  "ORD": {"tz":"America/Chicago","name":"O'Hare International Airport","city":"Chicago","country":"US"},
  "MDW": {"tz":"America/Chicago","name":"Chicago Midway International Airport","city":"Chicago","country":"US"},
  "DFW": {"tz":"America/Chicago","name":"Dallas/Fort Worth International Airport","city":"Dallas","country":"US"},
  "IAH": {"tz":"America/Chicago","name":"George Bush Intercontinental Airport","city":"Houston","country":"US"},
  "HOU": {"tz":"America/Chicago","name":"William P Hobby Airport","city":"Houston","country":"US"},
  "LAX": {"tz":"America/Los_Angeles","name":"Los Angeles International Airport","city":"Los Angeles","country":"US"},
  "SFO": {"tz":"America/Los_Angeles","name":"San Francisco International Airport","city":"San Francisco","country":"US"},
  "SAN": {"tz":"America/Los_Angeles","name":"San Diego International Airport","city":"San Diego","country":"US"},
  "LAS": {"tz":"America/Los_Angeles","name":"Harry Reid International Airport","city":"Las Vegas","country":"US"},
  "PHX": {"tz":"America/Phoenix","name":"Phoenix Sky Harbor International Airport","city":"Phoenix","country":"US"},
  "SEA": {"tz":"America/Los_Angeles","name":"Seattle-Tacoma International Airport","city":"Seattle","country":"US"},
  "PDX": {"tz":"America/Los_Angeles","name":"Portland International Airport","city":"Portland","country":"US"},
  "MIA": {"tz":"America/New_York","name":"Miami International Airport","city":"Miami","country":"US"},
  "MCO": {"tz":"America/New_York","name":"Orlando International Airport","city":"Orlando","country":"US"},
  "ATL": {"tz":"America/New_York","name":"Hartsfield-Jackson Atlanta International Airport","city":"Atlanta","country":"US"},
  "HNL": {"tz":"Pacific/Honolulu","name":"Daniel K Inouye International Airport","city":"Honolulu","country":"US"},
  "YYZ": {"tz":"America/Toronto","name":"Toronto Pearson International Airport","city":"Toronto","country":"CA"},
  "YVR": {"tz":"America/Vancouver","name":"Vancouver International Airport","city":"Vancouver","country":"CA"},
  "YUL": {"tz":"America/Toronto","name":"Montréal-Pierre Elliott Trudeau International Airport","city":"Montreal","country":"CA"},
  "YYC": {"tz":"America/Edmonton","name":"Calgary International Airport","city":"Calgary","country":"CA"},
  "NRT": {"tz":"Asia/Tokyo","name":"Narita International Airport","city":"Tokyo","country":"JP"},
  "HND": {"tz":"Asia/Tokyo","name":"Haneda Airport","city":"Tokyo","country":"JP"},
  "KIX": {"tz":"Asia/Tokyo","name":"Kansai International Airport","city":"Osaka","country":"JP"},
  "ITM": {"tz":"Asia/Tokyo","name":"Osaka International Airport","city":"Osaka","country":"JP"},
  "PEK": {"tz":"Asia/Shanghai","name":"Beijing Capital International Airport","city":"Beijing","country":"CN"},
  "PVG": {"tz":"Asia/Shanghai","name":"Shanghai Pudong International Airport","city":"Shanghai","country":"CN"},
  "SHA": {"tz":"Asia/Shanghai","name":"Shanghai Hongqiao International Airport","city":"Shanghai","country":"CN"},
  "CAN": {"tz":"Asia/Shanghai","name":"Guangzhou Baiyun International Airport","city":"Guangzhou","country":"CN"},
  "SZX": {"tz":"Asia/Shanghai","name":"Shenzhen Bao an International Airport","city":"Shenzhen","country":"CN"},
  "HKG": {"tz":"Asia/Hong_Kong","name":"Hong Kong International Airport","city":"Hong Kong","country":"HK"},
  "TPE": {"tz":"Asia/Taipei","name":"Taiwan Taoyuan International Airport","city":"Taipei","country":"TW"},
  "ICN": {"tz":"Asia/Seoul","name":"Incheon International Airport","city":"Seoul","country":"KR"},
  "GMP": {"tz":"Asia/Seoul","name":"Gimpo International Airport","city":"Seoul","country":"KR"},
  "SIN": {"tz":"Asia/Singapore","name":"Singapore Changi Airport","city":"Singapore","country":"SG"},
  "BKK": {"tz":"Asia/Bangkok","name":"Suvarnabhumi Airport","city":"Bangkok","country":"TH"},
  "DMK": {"tz":"Asia/Bangkok","name":"Don Mueang International Airport","city":"Bangkok","country":"TH"},
  "KUL": {"tz":"Asia/Kuala_Lumpur","name":"Kuala Lumpur International Airport","city":"Kuala Lumpur","country":"MY"},
  "DEL": {"tz":"Asia/Kolkata","name":"Indira Gandhi International Airport","city":"Delhi","country":"IN"},
  "BOM": {"tz":"Asia/Kolkata","name":"Chhatrapati Shivaji Maharaj International Airport","city":"Mumbai","country":"IN"},
  "DXB": {"tz":"Asia/Dubai","name":"Dubai International Airport","city":"Dubai","country":"AE"},
  "AUH": {"tz":"Asia/Dubai","name":"Abu Dhabi International Airport","city":"Abu Dhabi","country":"AE"},
  "LHR": {"tz":"Europe/London","name":"Heathrow Airport","city":"London","country":"GB"},
  "LGW": {"tz":"Europe/London","name":"Gatwick Airport","city":"London","country":"GB"},
  "STN": {"tz":"Europe/London","name":"London Stansted Airport","city":"London","country":"GB"},
  "CDG": {"tz":"Europe/Paris","name":"Charles de Gaulle Airport","city":"Paris","country":"FR"},
  "ORY": {"tz":"Europe/Paris","name":"Orly Airport","city":"Paris","country":"FR"},
  "FRA": {"tz":"Europe/Berlin","name":"Frankfurt Airport","city":"Frankfurt","country":"DE"},
  "MUC": {"tz":"Europe/Berlin","name":"Munich Airport","city":"Munich","country":"DE"},
  "AMS": {"tz":"Europe/Amsterdam","name":"Amsterdam Airport Schiphol","city":"Amsterdam","country":"NL"},
  "FCO": {"tz":"Europe/Rome","name":"Leonardo da Vinci-Fiumicino Airport","city":"Rome","country":"IT"},
  "MXP": {"tz":"Europe/Rome","name":"Malpensa Airport","city":"Milan","country":"IT"},
  "MAD": {"tz":"Europe/Madrid","name":"Adolfo Suárez Madrid-Barajas Airport","city":"Madrid","country":"ES"},
  "BCN": {"tz":"Europe/Madrid","name":"Barcelona-El Prat Airport","city":"Barcelona","country":"ES"},
  "ZRH": {"tz":"Europe/Zurich","name":"Zurich Airport","city":"Zurich","country":"CH"},
  "VIE": {"tz":"Europe/Vienna","name":"Vienna International Airport","city":"Vienna","country":"AT"},
  "IST": {"tz":"Europe/Istanbul","name":"Istanbul Airport","city":"Istanbul","country":"TR"},
  "SYD": {"tz":"Australia/Sydney","name":"Sydney Kingsford Smith Airport","city":"Sydney","country":"AU"},
  "MEL": {"tz":"Australia/Melbourne","name":"Melbourne Airport","city":"Melbourne","country":"AU"},
  "BNE": {"tz":"Australia/Brisbane","name":"Brisbane Airport","city":"Brisbane","country":"AU"},
  "PER": {"tz":"Australia/Perth","name":"Perth Airport","city":"Perth","country":"AU"},
  "AKL": {"tz":"Pacific/Auckland","name":"Auckland Airport","city":"Auckland","country":"NZ"},
  "WLG": {"tz":"Pacific/Auckland","name":"Wellington International Airport","city":"Wellington","country":"NZ"},
  "GRU": {"tz":"America/Sao_Paulo","name":"São Paulo-Guarulhos International Airport","city":"São Paulo","country":"BR"},
  "GIG": {"tz":"America/Sao_Paulo","name":"Rio de Janeiro-Galeão International Airport","city":"Rio de Janeiro","country":"BR"},
  "EZE": {"tz":"America/Argentina/Buenos_Aires","name":"Ministro Pistarini International Airport","city":"Buenos Aires","country":"AR"},
  "SCL": {"tz":"America/Santiago","name":"Arturo Merino Benítez International Airport","city":"Santiago","country":"CL"}
};

// Common timezone shortlist for select dropdowns
const COMMON_TIMEZONES = [
  "UTC","Europe/London","Europe/Paris","Europe/Berlin","America/New_York","America/Chicago",
  "America/Denver","America/Los_Angeles","America/Phoenix","America/Honolulu","Asia/Tokyo",
  "Asia/Shanghai","Asia/Hong_Kong","Asia/Taipei","Asia/Kolkata","Asia/Seoul","Australia/Sydney"
];

// Helper to create elements quickly
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  }
  return e;
}

let flightIdx = 0;

// Build timezone select + custom input
function buildTzSelect(selected) {
  const wrap = el('div', {class: 'tz-wrap'});
  const sel = el('select', {class: 'tz-select'});
  sel.appendChild(el('option', {value:''}, 'Select timezone'));
  for (const tz of COMMON_TIMEZONES) {
    const o = el('option', {value:tz}, tz);
    if (tz === selected) o.selected = true;
    sel.appendChild(o);
  }
  const customOpt = el('option', {value:'__custom__'}, 'Custom timezone...');
  sel.appendChild(customOpt);
  const customInput = el('input', {type:'text', placeholder:'e.g. America/New_York', class:'tz-custom', style:'margin-top:6px;display:none'});
  sel.addEventListener('change', () => {
    if (sel.value === '__custom__') customInput.style.display = 'block';
    else customInput.style.display = 'none';
  });
  if (selected && !COMMON_TIMEZONES.includes(selected)) {
    sel.value = '__custom__';
    customInput.style.display = 'block';
    customInput.value = selected;
  }
  wrap.appendChild(sel);
  wrap.appendChild(customInput);
  return wrap;
}

// Create a new flight card
function addFlight(pref = {}) {
  const idx = flightIdx++;
  const card = el('div', {class:'flight-card', 'data-idx': idx});

  // Row 1
  const row1 = el('div', {class:'row'});
  const flightNumWrap = el('div', {}, el('div',{class:'label'}, 'Flight number'), el('input',{type:'text', class:'flight-number', placeholder:'e.g., HA850', value: pref.flight_number||''}));
  const passengerWrap = el('div', {}, el('div',{class:'label'}, 'Passenger name'), el('input',{type:'text', class:'passenger-name', placeholder:'Passenger name', value: pref.passenger_name||''}));
  row1.appendChild(flightNumWrap);
  row1.appendChild(passengerWrap);
  card.appendChild(row1);

  // Departure block
  card.appendChild(el('div', {}, el('div',{class:'label'}, 'Departure')));
  const rowDep = el('div', {class:'row'});
  const depAirport = el('input', {type:'text', class:'dep-airport airport-input', placeholder:'JFK', value: pref.departure_airport||''});
  const depTz = buildTzSelect(pref.departure_timezone || '');
  const depTime = el('input', {type:'text', class:'dep-time', placeholder:'YYYY-MM-DD HH:MM', value: pref.departure_time_str||''});
  rowDep.appendChild(el('div', {}, el('div',{class:'label'}, 'Airport code'), depAirport));
  rowDep.appendChild(el('div', {}, el('div',{class:'label'}, 'Timezone'), depTz));
  rowDep.appendChild(el('div', {}, el('div',{class:'label'}, 'Date & time'), depTime));
  card.appendChild(rowDep);

  // Arrival block
  card.appendChild(el('div', {}, el('div',{class:'label'}, 'Arrival')));
  const rowArr = el('div', {class:'row'});
  const arrAirport = el('input', {type:'text', class:'arr-airport airport-input', placeholder:'HNL', value: pref.arrival_airport||''});
  const arrTz = buildTzSelect(pref.arrival_timezone || '');
  const arrTime = el('input', {type:'text', class:'arr-time', placeholder:'YYYY-MM-DD HH:MM', value: pref.arrival_time_str||''});
  rowArr.appendChild(el('div', {}, el('div',{class:'label'}, 'Airport code'), arrAirport));
  rowArr.appendChild(el('div', {}, el('div',{class:'label'}, 'Timezone'), arrTz));
  rowArr.appendChild(el('div', {}, el('div',{class:'label'}, 'Date & time'), arrTime));
  card.appendChild(rowArr);

  // Optional details + remove
  const rowOpt = el('div', {class:'row'});
  rowOpt.appendChild(el('div', {}, el('div',{class:'label'}, 'Seat'), el('input', {type:'text', class:'seat', placeholder:'12A', value: pref.seat||''})));
  rowOpt.appendChild(el('div', {}, el('div',{class:'label'}, 'Class'), el('input', {type:'text', class:'class', placeholder:'Economy', value: pref.class||''})));
  const removeWrap = el('div', {}, el('div',{class:'label'}, ' '));
  const removeBtn = el('button', {class:'remove-btn'}, 'Remove');
  removeBtn.addEventListener('click', () => card.remove());
  removeWrap.appendChild(removeBtn);
  rowOpt.appendChild(removeWrap);
  card.appendChild(rowOpt);

  // Auto-fill timezone when airport input changes or loses focus
  const airportInputs = card.querySelectorAll('.airport-input');
  airportInputs.forEach(input => {
    input.addEventListener('blur', (ev) => tryAutoFillTz(ev.target));
    input.addEventListener('input', (ev) => {
      // If user typed 3 chars, attempt autofill (non-blocking)
      const v = ev.target.value.trim().toUpperCase();
      if (v.length === 3) tryAutoFillTz(ev.target);
    });
  });

  document.getElementById('flights').appendChild(card);
  return card;
}

// Attempt to autofill timezone for an airport input
function tryAutoFillTz(airportInput) {
  const code = (airportInput.value || '').trim().toUpperCase();
  if (!code) return;
  const card = airportInput.closest('.flight-card');
  if (!card) return;

  const isDep = airportInput.classList.contains('dep-airport');
  const tzWrap = isDep ? card.querySelector('.tz-wrap') : card.querySelectorAll('.tz-wrap')[1];
  // tz-wrap contains a select.tz-select and input.tz-custom
  if (!tzWrap) return;
  const tzSelect = tzWrap.querySelector('.tz-select');
  const tzCustom = tzWrap.querySelector('.tz-custom');

  if (AIRPORTS[code]) {
    const tz = AIRPORTS[code].tz;
    // If tz is in common list, set select; else set custom
    if (COMMON_TIMEZONES.includes(tz)) {
      tzSelect.value = tz;
      tzCustom.style.display = 'none';
      tzCustom.value = '';
    } else {
      tzSelect.value = '__custom__';
      tzCustom.style.display = 'block';
      tzCustom.value = tz;
    }
  }
}

// Collect flights data from DOM
function collectFlights() {
  const cards = document.querySelectorAll('.flight-card');
  const flights = [];
  for (const card of cards) {
    const fnum = card.querySelector('.flight-number').value.trim() || '(unknown)';
    const pname = card.querySelector('.passenger-name').value.trim() || '(unknown)';

    const depAirport = card.querySelector('.dep-airport').value.trim().toUpperCase();
    const depTzSelect = card.querySelectorAll('.tz-select')[0].value;
    const depTzCustom = card.querySelectorAll('.tz-custom')[0].value.trim();
    const depTz = depTzSelect === '__custom__' ? (depTzCustom || 'UTC') : (depTzSelect || 'UTC');
    const depTimeStr = card.querySelector('.dep-time').value.trim();

    const arrAirport = card.querySelector('.arr-airport').value.trim().toUpperCase();
    const arrTzSelect = card.querySelectorAll('.tz-select')[1].value;
    const arrTzCustom = card.querySelectorAll('.tz-custom')[1].value.trim();
    const arrTz = arrTzSelect === '__custom__' ? (arrTzCustom || 'UTC') : (arrTzSelect || 'UTC');
    const arrTimeStr = card.querySelector('.arr-time').value.trim();

    const seat = card.querySelector('.seat').value.trim();
    const cls = card.querySelector('.class').value.trim();

    flights.push({
      flight_number: fnum,
      passenger_name: pname,
      departure_airport: depAirport,
      departure_timezone: depTz,
      departure_time_str: depTimeStr,
      arrival_airport: arrAirport,
      arrival_timezone: arrTz,
      arrival_time_str: arrTimeStr,
      seat: seat,
      class: cls
    });
  }
  return flights;
}

// Date parsing to UTC ICS timestamp string (YYYYMMDDTHHMMSSZ)
function parseToUTCString(localStr, tz) {
  const dt = DateTime.fromFormat(localStr, 'yyyy-LL-dd HH:mm', {zone: tz});
  if (!dt.isValid) return null;
  return dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
}

// Escape ICS special characters
function icsEscape(text) {
  return (text||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}

// Build ICS (events use UTC timestamps to avoid needing VTIMEZONE blocks)
function buildICS(flights) {
  const nowUTC = DateTime.utc().toFormat("yyyyLLdd'T'HHmmss'Z'");
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//air2cal static generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n') + '\r\n';

  for (const f of flights) {
    const dtstart = parseToUTCString(f.departure_time_str, f.departure_timezone);
    const dtend = parseToUTCString(f.arrival_time_str, f.arrival_timezone);
    if (!dtstart || !dtend) {
      throw new Error(`Invalid date/time for flight ${f.flight_number}. Use format YYYY-MM-DD HH:MM and valid timezone.`);
    }

    const uid = `flight-${f.flight_number.replace(/\s+/g,'-')}-${dtstart}-${Math.floor(Math.random()*10000)}@static`;
    const summary = `✈️ ${f.flight_number} ${f.departure_airport} → ${f.arrival_airport}`;
    const description = [
      `Flight: ${f.flight_number}`,
      `Passenger: ${f.passenger_name}`,
      `Depart: ${f.departure_time_str} (${f.departure_timezone})`,
      `Arrive: ${f.arrival_time_str} (${f.arrival_timezone})`,
      `Seat: ${f.seat || 'Not assigned'}`,
      `Class: ${f.class || 'Not specified'}`
    ].join('\n');

    const event = [
      'BEGIN:VEVENT',
      `UID:${icsEscape(uid)}`,
      `DTSTAMP:${nowUTC}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `LOCATION:${icsEscape(f.departure_airport)} → ${icsEscape(f.arrival_airport)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      'END:VEVENT'
    ].join('\r\n') + '\r\n';

    ics += event;
  }

  ics += 'END:VCALENDAR\r\n';
  return ics;
}

// UI wiring after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  const flightsEl = document.getElementById('flights');
  const addBtn = document.getElementById('addFlight');
  const genBtn = document.getElementById('generate');
  const downloadLink = document.getElementById('downloadLink');

  addBtn.addEventListener('click', () => addFlight());
  genBtn.addEventListener('click', () => {
    try {
      const flights = collectFlights();
      if (flights.length === 0) throw new Error('Add at least one flight.');

      const ics = buildICS(flights);
      const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const ts = DateTime.utc().toFormat("yyyyLLdd_HHmmss");
      downloadLink.href = url;
      downloadLink.download = `flights_${ts}.ics`;
      downloadLink.style.display = 'inline-block';
      downloadLink.textContent = `Download flights_${ts}.ics`;
      // Auto-click to start download
      downloadLink.click();
    } catch (err) {
      alert('Error: ' + err.message);
      console.error(err);
    }
  });

  // Add one initial flight card
  addFlight();
});