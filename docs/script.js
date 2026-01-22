// script.js
// Uses Luxon (loaded in index.html via CDN) for timezone-aware parsing
const DateTime = luxon.DateTime;

const commonTimezones = [
  "UTC","Europe/London","Europe/Paris","Europe/Berlin","America/New_York","America/Chicago",
  "America/Denver","America/Los_Angeles","America/Phoenix","America/Honolulu","Asia/Tokyo",
  "Asia/Shanghai","Asia/Hong_Kong","Asia/Taipei","Asia/Kolkata","Asia/Seoul","Australia/Sydney"
];

// Helpers
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

// Create a flight card
let flightIdx = 0;
function addFlight(pref = {}) {
  const idx = flightIdx++;
  const card = el('div', {class:'flight-card', 'data-idx': idx});

  / Top row: flight number, passenger
  const row1 = el('div', {class:'row'});
  row1.appendChild(el('div', {}, el('div',{class:'label'}, 'Flight number'), el('input',{type:'text', placeholder:'e.g., HA850', value: pref.flight_number||''})));
  row1.appendChild(el('div', {}, el('div',{class:'label'}, 'Passenger name'), el('input',{type:'text', placeholder:'Passenger name', value: pref.passenger_name||''})));
  card.appendChild(row1);

  // Departure
  const depBlock = el('div', {}, el('div',{class:'label'}, 'Departure'));
  const rowDep = el('div',{class:'row'});
  rowDep.appendChild(el('div',{}, el('div',{class:'label'}, 'Airport code'), el('input',{type:'text', placeholder:'JFK', value: pref.departure_airport||''})));
  rowDep.appendChild(el('div',{}, el('div',{class:'label'}, 'Timezone'), buildTzSelect(pref.departure_timezone)));
  rowDep.appendChild(el('div',{}, el('div',{class:'label'}, 'Date & time (YYYY-MM-DD HH:MM)'), el('input',{type:'text', placeholder:'2026-01-22 09:30', value: pref.departure_time_str||''})));
  card.appendChild(depBlock);
  card.appendChild(rowDep);

  // Arrival
  const arrBlock = el('div', {}, el('div',{class:'label'}, 'Arrival'));
  const rowArr = el('div',{class:'row'});
  rowArr.appendChild(el('div',{}, el('div',{class:'label'}, 'Airport code'), el('input',{type:'text', placeholder:'HNL', value: pref.arrival_airport||''})));
  rowArr.appendChild(el('div',{}, el('div',{class:'label'}, 'Timezone'), buildTzSelect(pref.arrival_timezone)));
  rowArr.appendChild(el('div',{}, el('div',{class:'label'}, 'Date & time (YYYY-MM-DD HH:MM)'), el('input',{type:'text', placeholder:'2026-01-22 20:00', value: pref.arrival_time_str||''})));
  card.appendChild(arrBlock);
  card.appendChild(rowArr);

  // Optional details + remove
  const rowOpt = el('div',{class:'row'});
  rowOpt.appendChild(el('div',{}, el('div',{class:'label'}, 'Seat'), el('input',{type:'text', placeholder:'12A', value: pref.seat||''})));
  rowOpt.appendChild(el('div',{}, el('div',{class:'label'}, 'Class'), el('input',{type:'text', placeholder:'Economy', value: pref.class||''})));
  const removeBtn = el('button',{class:'remove-btn'}, 'Remove');
  removeBtn.onclick = () => card.remove();
  const removeWrap = el('div', {}, el('div',{class:'label'}, ' '), removeBtn);
  rowOpt.appendChild(removeWrap);
  card.appendChild(rowOpt);

  document.getElementById('flights').appendChild(card);
}

// Build timezone select + custom option
function buildTzSelect(selected) {
  const wrap = el('div');
  const sel = el('select');
  const customOpt = el('option', {value:'__custom__'}, 'Custom timezone...');
  sel.appendChild(el('option', {value:''}, 'Select timezone'));
  for (const tz of commonTimezones) {
    const o = el('option', {value:tz}, tz);
    if (tz === selected) o.selected = true;
    sel.appendChild(o);
  }
  sel.appendChild(customOpt);
  const customInput = el('input', {type:'text', placeholder:'e.g. America/New_York', style:'margin-top:6px;display:none'});
  sel.onchange = () => {
    if (sel.value === '__custom__') customInput.style.display = 'block';
    else customInput.style.display = 'none';
  };
  if (selected && !commonTimezones.includes(selected)) {
    sel.value='__custom__';
    customInput.style.display='block';
    customInput.value = selected;
  }
  wrap.appendChild(sel);
  wrap.appendChild(customInput);
  return wrap;
}

// Collect flights from DOM
function collectFlights() {
  const cards = document.querySelectorAll('.flight-card');
  const flights = [];
  for (const c of cards) {
    const inputs = c.querySelectorAll('input, select');
    // Map by position (we built them in fixed order)
    const values = Array.from(inputs).map(i => i.value.trim());
    // Order: flightnum, passenger, dep code, dep tz select, dep tz custom, dep dt, arr code, arr tz select, arr tz custom, arr dt, seat, class
    const flight = {
      flight_number: values[0] || '(unknown)',
      passenger_name: values[1] || '(unknown)',
      departure_airport: values[2] || '',
      departure_timezone: values[3] === '__custom__' ? values[4] || 'UTC' : (values[3] || 'UTC'),
      departure_time_str: values[5] || '',
      arrival_airport: values[6] || '',
      arrival_timezone: values[7] === '__custom__' ? values[8] || 'UTC' : (values[7] || 'UTC'),
      arrival_time_str: values[9] || '',
      seat: values[10] || '',
      class: values[11] || ''
    };
    flights.push(flight);
  }
  return flights;
}

// Format datetimes into ICS UTC format (YYYYMMDDTHHMMSSZ)
function parseToUTCString(localStr, tz) {
  // Expect input "YYYY-MM-DD HH:MM"
  const dt = DateTime.fromFormat(localStr, 'yyyy-LL-dd HH:mm', {zone: tz});
  if (!dt.isValid) return null;
  return dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
}

// Escape text for ICS (simple)
function icsEscape(text) {
  return (text||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}

// Build ICS content (events use UTC timestamps to avoid VTIMEZONE complexity)
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
      throw new Error(`Invalid date/time for flight ${f.flight_number}. Use format YYYY-MM-DD HH:MM`);
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

// UI wiring
document.getElementById('addFlight').onclick = () => addFlight();
document.getElementById('generate').onclick = () => {
  try {
    const flights = collectFlights();
    if (flights.length === 0) throw new Error('Add at least one flight');

    const ics = buildICS(flights);
    const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    const ts = DateTime.utc().toFormat("yyyyLLdd_HHmmss");
    link.download = `flights_${ts}.ics`;
    link.style.display = 'inline-block';
    link.textContent = `Download flights_${ts}.ics`;
    // Optionally auto-click:
    link.click();
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// Add an initial flight row
addFlight();/
