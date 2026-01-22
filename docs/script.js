// script.js
// Uses Luxon (loaded in index.html via CDN)
const DateTime = luxon.DateTime;

/*
  TODO: add more well defined airports as needed.
*/
const AIRPORTS = {
  "ATL": {"tz":"America/New_York","name":"Hartsfield-Jackson Atlanta International Airport","city":"Atlanta","country":"US"},
  "PEK": {"tz":"Asia/Shanghai","name":"Beijing Capital International Airport","city":"Beijing","country":"CN"},
  "LAX": {"tz":"America/Los_Angeles","name":"Los Angeles International Airport","city":"Los Angeles","country":"US"},
  "DXB": {"tz":"Asia/Dubai","name":"Dubai International Airport","city":"Dubai","country":"AE"},
  "HND": {"tz":"Asia/Tokyo","name":"Tokyo Haneda Airport","city":"Tokyo","country":"JP"},
  "ORD": {"tz":"America/Chicago","name":"O'Hare International Airport","city":"Chicago","country":"US"},
  "LHR": {"tz":"Europe/London","name":"Heathrow Airport","city":"London","country":"GB"},
  "HKG": {"tz":"Asia/Hong_Kong","name":"Hong Kong International Airport","city":"Hong Kong","country":"HK"},
  "PVG": {"tz":"Asia/Shanghai","name":"Shanghai Pudong International Airport","city":"Shanghai","country":"CN"},
  "CDG": {"tz":"Europe/Paris","name":"Charles de Gaulle Airport","city":"Paris","country":"FR"},
  "AMS": {"tz":"Europe/Amsterdam","name":"Amsterdam Airport Schiphol","city":"Amsterdam","country":"NL"},
  "FRA": {"tz":"Europe/Berlin","name":"Frankfurt Airport","city":"Frankfurt","country":"DE"},
  "IST": {"tz":"Europe/Istanbul","name":"Istanbul Airport","city":"Istanbul","country":"TR"},
  "CAN": {"tz":"Asia/Shanghai","name":"Guangzhou Baiyun International Airport","city":"Guangzhou","country":"CN"},
  "SFO": {"tz":"America/Los_Angeles","name":"San Francisco International Airport","city":"San Francisco","country":"US"},
  "DEL": {"tz":"Asia/Kolkata","name":"Indira Gandhi International Airport","city":"New Delhi","country":"IN"},
  "CGK": {"tz":"Asia/Jakarta","name":"Soekarno–Hatta International Airport","city":"Jakarta","country":"ID"},
  "SIN": {"tz":"Asia/Singapore","name":"Singapore Changi Airport","city":"Singapore","country":"SG"},
  "ICN": {"tz":"Asia/Seoul","name":"Incheon International Airport","city":"Seoul","country":"KR"},
  "KUL": {"tz":"Asia/Kuala_Lumpur","name":"Kuala Lumpur International Airport","city":"Kuala Lumpur","country":"MY"},
  "DEN": {"tz":"America/Denver","name":"Denver International Airport","city":"Denver","country":"US"},
  "BKK": {"tz":"Asia/Bangkok","name":"Suvarnabhumi Airport","city":"Bangkok","country":"TH"},
  "JFK": {"tz":"America/New_York","name":"John F. Kennedy International Airport","city":"New York","country":"US"},
  "LAS": {"tz":"America/Los_Angeles","name":"Harry Reid International Airport","city":"Las Vegas","country":"US"},
  "CLT": {"tz":"America/New_York","name":"Charlotte Douglas International Airport","city":"Charlotte","country":"US"},
  "MCO": {"tz":"America/New_York","name":"Orlando International Airport","city":"Orlando","country":"US"},
  "SZX": {"tz":"Asia/Shanghai","name":"Shenzhen Bao'an International Airport","city":"Shenzhen","country":"CN"},
  "MIA": {"tz":"America/New_York","name":"Miami International Airport","city":"Miami","country":"US"},
  "SEA": {"tz":"America/Los_Angeles","name":"Seattle-Tacoma International Airport","city":"Seattle","country":"US"},
  "MEX": {"tz":"America/Mexico_City","name":"Mexico City International Airport","city":"Mexico City","country":"MX"},
  "YVR": {"tz":"America/Vancouver","name":"Vancouver International Airport","city":"Vancouver","country":"CA"},
  "YYZ": {"tz":"America/Toronto","name":"Toronto Pearson International Airport","city":"Toronto","country":"CA"},
  "NRT": {"tz":"Asia/Tokyo","name":"Narita International Airport","city":"Tokyo","country":"JP"},
  "MSP": {"tz":"America/Chicago","name":"Minneapolis−Saint Paul International Airport","city":"Minneapolis","country":"US"},
  "DTW": {"tz":"America/Detroit","name":"Detroit Metropolitan Airport","city":"Detroit","country":"US"},
  "PHX": {"tz":"America/Phoenix","name":"Phoenix Sky Harbor International Airport","city":"Phoenix","country":"US"},
  "IAH": {"tz":"America/Chicago","name":"George Bush Intercontinental Airport","city":"Houston","country":"US"},
  "SYD": {"tz":"Australia/Sydney","name":"Sydney Kingsford Smith Airport","city":"Sydney","country":"AU"},
  "MUC": {"tz":"Europe/Berlin","name":"Munich Airport","city":"Munich","country":"DE"},
  "BCN": {"tz":"Europe/Madrid","name":"Barcelona–El Prat Airport","city":"Barcelona","country":"ES"},
  "MAD": {"tz":"Europe/Madrid","name":"Adolfo Suárez Madrid–Barajas Airport","city":"Madrid","country":"ES"},
  "SVO": {"tz":"Europe/Moscow","name":"Sheremetyevo International Airport","city":"Moscow","country":"RU"},
  "FCO": {"tz":"Europe/Rome","name":"Leonardo da Vinci–Fiumicino Airport","city":"Rome","country":"IT"},
  "EWR": {"tz":"America/New_York","name":"Newark Liberty International Airport","city":"Newark","country":"US"},
  "DFW": {"tz":"America/Chicago","name":"Dallas/Fort Worth International Airport","city":"Dallas/Fort Worth","country":"US"},
  "KIX": {"tz":"Asia/Tokyo","name":"Kansai International Airport","city":"Osaka","country":"JP"},
  "BNE": {"tz":"Australia/Brisbane","name":"Brisbane Airport","city":"Brisbane","country":"AU"},
  "GIG": {"tz":"America/Sao_Paulo","name":"Rio de Janeiro–Galeão International Airport","city":"Rio de Janeiro","country":"BR"},
  "GRU": {"tz":"America/Sao_Paulo","name":"São Paulo–Guarulhos International Airport","city":"São Paulo","country":"BR"},
  "DOH": {"tz":"Asia/Qatar","name":"Hamad International Airport","city":"Doha","country":"QA"},
  "LGA": {"tz":"America/New_York","name":"LaGuardia Airport","city":"New York","country":"US"},
  "SCL": {"tz":"America/Santiago","name":"Comodoro Arturo Merino Benítez International Airport","city":"Santiago","country":"CL"},
  "ARN": {"tz":"Europe/Stockholm","name":"Stockholm Arlanda Airport","city":"Stockholm","country":"SE"},
  "OSL": {"tz":"Europe/Oslo","name":"Oslo Airport, Gardermoen","city":"Oslo","country":"NO"},
  "ZRH": {"tz":"Europe/Zurich","name":"Zurich Airport","city":"Zurich","country":"CH"},
  "VIE": {"tz":"Europe/Vienna","name":"Vienna International Airport","city":"Vienna","country":"AT"},
  "GVA": {"tz":"Europe/Zurich","name":"Geneva Airport","city":"Geneva","country":"CH"},
  "PRG": {"tz":"Europe/Prague","name":"Václav Havel Airport Prague","city":"Prague","country":"CZ"},
  "WAW": {"tz":"Europe/Warsaw","name":"Warsaw Chopin Airport","city":"Warsaw","country":"PL"},
  "LIS": {"tz":"Europe/Lisbon","name":"Humberto Delgado Airport","city":"Lisbon","country":"PT"},
  "ATH": {"tz":"Europe/Athens","name":"Athens International Airport","city":"Athens","country":"GR"},
  "CPH": {"tz":"Europe/Copenhagen","name":"Copenhagen Airport","city":"Copenhagen","country":"DK"},
  "MAN": {"tz":"Europe/London","name":"Manchester Airport","city":"Manchester","country":"GB"},
  "DUB": {"tz":"Europe/Dublin","name":"Dublin Airport","city":"Dublin","country":"IE"},
  "IAD": {"tz":"America/New_York","name":"Washington Dulles International Airport","city":"Washington","country":"US"},
  "SJC": {"tz":"America/Los_Angeles","name":"Norman Y. Mineta San Jose International Airport","city":"San Jose","country":"US"},
  "YUL": {"tz":"America/Toronto","name":"Montréal–Trudeau International Airport","city":"Montreal","country":"CA"},
  "YYC": {"tz":"America/Edmonton","name":"Calgary International Airport","city":"Calgary","country":"CA"},
  "AUS": {"tz":"America/Chicago","name":"Austin–Bergstrom International Airport","city":"Austin","country":"US"},
  "JNB": {"tz":"Africa/Johannesburg","name":"O. R. Tambo International Airport","city":"Johannesburg","country":"ZA"},
  "CPT": {"tz":"Africa/Johannesburg","name":"Cape Town International Airport","city":"Cape Town","country":"ZA"},
  "EZE": {"tz":"America/Argentina/Buenos_Aires","name":"Ministro Pistarini International Airport","city":"Buenos Aires","country":"AR"},
  "LIM": {"tz":"America/Lima","name":"Jorge Chávez International Airport","city":"Lima","country":"PE"},
  "BOG": {"tz":"America/Bogota","name":"El Dorado International Airport","city":"Bogotá","country":"CO"},
  "CUN": {"tz":"America/Cancun","name":"Cancún International Airport","city":"Cancún","country":"MX"},
  "SJU": {"tz":"America/Puerto_Rico","name":"Luis Muñoz Marín International Airport","city":"San Juan","country":"PR"},
  "PHL": {"tz":"America/New_York","name":"Philadelphia International Airport","city":"Philadelphia","country":"US"},
  "PIT": {"tz":"America/New_York","name":"Pittsburgh International Airport","city":"Pittsburgh","country":"US"},
  "CLE": {"tz":"America/New_York","name":"Cleveland Hopkins International Airport","city":"Cleveland","country":"US"},
  "RSW": {"tz":"America/New_York","name":"Southwest Florida International Airport","city":"Fort Myers","country":"US"},
  "TPE": {"tz":"Asia/Taipei","name":"Taiwan Taoyuan International Airport","city":"Taipei","country":"TW"},
  "MEL": {"tz":"Australia/Melbourne","name":"Melbourne Airport","city":"Melbourne","country":"AU"},
  "AKL": {"tz":"Pacific/Auckland","name":"Auckland Airport","city":"Auckland","country":"NZ"},
  "BOM": {"tz":"Asia/Kolkata","name":"Chhatrapati Shivaji Maharaj International Airport","city":"Mumbai","country":"IN"},
  "BLR": {"tz":"Asia/Kolkata","name":"Kempegowda International Airport","city":"Bengaluru","country":"IN"},
  "KMG": {"tz":"Asia/Shanghai","name":"Kunming Changshui International Airport","city":"Kunming","country":"CN"},
  "CGN": {"tz":"Europe/Berlin","name":"Cologne Bonn Airport","city":"Cologne","country":"DE"},
  "NCE": {"tz":"Europe/Paris","name":"Nice Côte d'Azur Airport","city":"Nice","country":"FR"},
  "MXP": {"tz":"Europe/Rome","name":"Milan Malpensa Airport","city":"Milan","country":"IT"},
  "VCE": {"tz":"Europe/Rome","name":"Venice Marco Polo Airport","city":"Venice","country":"IT"},
  "LGW": {"tz":"Europe/London","name":"Gatwick Airport","city":"London","country":"GB"},
  "ORL": {"tz":"America/New_York","name":"Orlando Executive Airport","city":"Orlando","country":"US"},
  "PRN": {"tz":"Europe/Belgrade","name":"Pristina International Airport","city":"Pristina","country":"XK"} // extra small entry (example)
  // If you'd like more airports, we can expand further or load a full dataset.
};

document.addEventListener('DOMContentLoaded', () => {
  // State
  let flights = [];
  let editingIndex = null; // null = new

  // Modal elements
  const modalOverlay = document.getElementById('modalOverlay');
  const flightForm = document.getElementById('flightForm');
  const modalTitle = document.getElementById('modalTitle');

  // Form fields (note date + time separated)
  const fld = {
    flight_number: document.getElementById('flight_number'),
    passenger_name: document.getElementById('passenger_name'),
    departure_airport: document.getElementById('departure_airport'),
    departure_timezone: document.getElementById('departure_timezone'),
    departure_date: document.getElementById('departure_date'), // type=date
    departure_time: document.getElementById('departure_time'), // type=time (step=900 in HTML)
    arrival_airport: document.getElementById('arrival_airport'),
    arrival_timezone: document.getElementById('arrival_timezone'),
    arrival_date: document.getElementById('arrival_date'),
    arrival_time: document.getElementById('arrival_time'),
    seat: document.getElementById('seat'),
    class: document.getElementById('class'),
    baggage: document.getElementById('baggage'),
  };

  // Round DateTime to nearest step (15 minutes)
  function roundToStep(dateTime, stepMinutes = 15) {
    const totalMinutes = dateTime.hour * 60 + dateTime.minute;
    const rounded = Math.round(totalMinutes / stepMinutes) * stepMinutes;
    const hh = String(Math.floor((rounded / 60) % 24)).padStart(2, '0');
    const mm = String(rounded % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /* UI wiring */

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

  /* Modal open/close and editing */

  function openModalForNew() {
    editingIndex = null;
    modalTitle.textContent = 'Add Flight';
    flightForm.reset();
    fld.departure_timezone.value = '';
    fld.arrival_timezone.value = '';

    // set default date to today for convenience
    const today = DateTime.now().toISODate();
    fld.departure_date.value = today;
    fld.arrival_date.value = today;

    // default times: current time rounded to nearest 15 minutes
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

    // airports / tz
    fld.departure_airport.value = f.departure_airport || '';
    fld.departure_timezone.value = f.departure_timezone || '';
    fld.arrival_airport.value = f.arrival_airport || '';
    fld.arrival_timezone.value = f.arrival_timezone || '';

    // dates/times
    fld.departure_date.value = f.departure_date || '';
    fld.departure_time.value = f.departure_time || '00:00';
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

  /* Validate & save */

  function saveFlight(keepOpen) {
    // Read fields
    const flight_number = fld.flight_number.value.trim() || '(unknown)';
    const passenger_name = fld.passenger_name.value.trim() || '(unknown)';
    const departure_airport = fld.departure_airport.value.trim().toUpperCase();
    let departure_timezone = fld.departure_timezone.value.trim();
    const departure_date = fld.departure_date.value; // YYYY-MM-DD
    const departure_time = fld.departure_time.value; // HH:mm

    const arrival_airport = fld.arrival_airport.value.trim().toUpperCase();
    let arrival_timezone = fld.arrival_timezone.value.trim();
    const arrival_date = fld.arrival_date.value;
    const arrival_time = fld.arrival_time.value;

    const seat = fld.seat.value.trim();
    const flight_class = fld.class.value.trim();
    const baggage = fld.baggage.value.trim();

    // Auto-fill tz from map if empty
    if (!departure_timezone && AIRPORTS[departure_airport]) departure_timezone = AIRPORTS[departure_airport].tz || '';
    if (!arrival_timezone && AIRPORTS[arrival_airport]) arrival_timezone = AIRPORTS[arrival_airport].tz || '';

    // Basic validation: require airport codes and date+time
    if (!departure_airport || !departure_date || !departure_time) { alert('Please provide departure airport, date and time.'); return; }
    if (!arrival_airport || !arrival_date || !arrival_time) { alert('Please provide arrival airport, date and time.'); return; }

    // Combine for validation
    const depCombined = `${departure_date} ${departure_time}`;
    const arrCombined = `${arrival_date} ${arrival_time}`;

    // Validate date/time parsing with Luxon
    const dtDep = DateTime.fromFormat(depCombined, 'yyyy-LL-dd HH:mm', {zone: departure_timezone || 'UTC'});
    const dtArr = DateTime.fromFormat(arrCombined, 'yyyy-LL-dd HH:mm', {zone: arrival_timezone || 'UTC'});
    if (!dtDep.isValid) { alert('Departure date/time is invalid. Use the date picker and choose a valid time.'); return; }
    if (!dtArr.isValid) { alert('Arrival date/time is invalid. Use the date picker and choose a valid time.'); return; }

    const flight = {
      flight_number, passenger_name,
      departure_airport, departure_timezone: departure_timezone || 'UTC',
      departure_date, departure_time,
      arrival_airport, arrival_timezone: arrival_timezone || 'UTC',
      arrival_date, arrival_time,
      seat, class: flight_class, baggage,
      // keep legacy combined fields for compatibility if needed
      departure_time_combined: depCombined,
      arrival_time_combined: arrCombined
    };

    if (editingIndex === null) {
      flights.push(flight);
    } else {
      flights[editingIndex] = flight;
    }

    renderFlights();
    if (!keepOpen) closeModal();
    else {
      // reset form for next entry but preserve timezone autofill if desired
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

  /* Render flight summaries list */

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

  /* Build ICS content (UTC timestamps) */

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

  // Close modal when clicking outside modal content
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Initialize (shows no flights initially)
  renderFlights();
});