import os
from datetime import datetime
from zoneinfo import ZoneInfo
import json
from pathlib import Path

# Try to import airportsdata, install if not available
try:
    import airportsdata
    AIRPORTSDATA_AVAILABLE = True
except ImportError:
    AIRPORTSDATA_AVAILABLE = False
    print("Note: airportsdata package not installed. Will use limited built-in data.")

class AirportDatabase:
    """Airport database using airportsdata package."""
    
    def __init__(self, use_cache=True):
        self.airports = {}
        self.cache_file = Path("airport_timezone_cache.json")
        self.use_cache = use_cache
        
        if AIRPORTSDATA_AVAILABLE:
            self.load_airportsdata()
        else:
            self.load_builtin_data()
        
        # Load additional cached airports if available
        if use_cache and self.cache_file.exists():
            self.load_cache()
    
    def load_airportsdata(self):
        """Load airport data from airportsdata package."""
        print("Loading airport data from airportsdata package...")
        try:
            # Load IATA airport codes (3-letter codes like JFK, LAX)
            airports_iata = airportsdata.load('IATA')
            
            # Also load ICAO codes (4-letter codes like KJFK, KLAX) for better coverage
            airports_icao = airportsdata.load('ICAO')
            
            # Combine both datasets
            for code, data in airports_iata.items():
                if code and len(code) == 3:  # Only store valid IATA codes
                    self.airports[code.upper()] = {
                        'name': data.get('name', ''),
                        'city': data.get('city', ''),
                        'country': data.get('country', ''),
                        'tz': data.get('tz', ''),
                        'lat': data.get('lat', ''),
                        'lon': data.get('lon', ''),
                        'alt': data.get('alt', ''),
                        'icao': data.get('icao', '')
                    }
            
            # Add ICAO airports that might not be in IATA dataset
            for code, data in airports_icao.items():
                if code and len(code) == 4:  # ICAO code
                    # Try to find corresponding IATA code
                    iata_code = data.get('iata', '')
                    if iata_code and iata_code not in self.airports:
                        self.airports[iata_code.upper()] = {
                            'name': data.get('name', ''),
                            'city': data.get('city', ''),
                            'country': data.get('country', ''),
                            'tz': data.get('tz', ''),
                            'lat': data.get('lat', ''),
                            'lon': data.get('lon', ''),
                            'alt': data.get('alt', ''),
                            'icao': code
                        }
            
            print(f"✓ Loaded {len(self.airports)} airports from airportsdata")
            
            # Save to cache for offline use
            if self.use_cache:
                self.save_cache()
                
        except Exception as e:
            print(f"Error loading airportsdata: {e}")
            self.load_builtin_data()
    
    def load_builtin_data(self):
        """Load built-in airport data when airportsdata is not available."""
        print("Using built-in airport database...")
        
        # Comprehensive airport database with timezones
        builtin_airports = {
            # North America - USA
            'JFK': {'tz': 'America/New_York', 'name': 'John F Kennedy International Airport', 'city': 'New York', 'country': 'US'},
            'LGA': {'tz': 'America/New_York', 'name': 'LaGuardia Airport', 'city': 'New York', 'country': 'US'},
            'EWR': {'tz': 'America/New_York', 'name': 'Newark Liberty International Airport', 'city': 'Newark', 'country': 'US'},
            'BOS': {'tz': 'America/New_York', 'name': 'Logan International Airport', 'city': 'Boston', 'country': 'US'},
            'ORD': {'tz': 'America/Chicago', 'name': "O'Hare International Airport", 'city': 'Chicago', 'country': 'US'},
            'MDW': {'tz': 'America/Chicago', 'name': 'Chicago Midway International Airport', 'city': 'Chicago', 'country': 'US'},
            'DFW': {'tz': 'America/Chicago', 'name': 'Dallas/Fort Worth International Airport', 'city': 'Dallas', 'country': 'US'},
            'IAH': {'tz': 'America/Chicago', 'name': 'George Bush Intercontinental Airport', 'city': 'Houston', 'country': 'US'},
            'HOU': {'tz': 'America/Chicago', 'name': 'William P Hobby Airport', 'city': 'Houston', 'country': 'US'},
            'LAX': {'tz': 'America/Los_Angeles', 'name': 'Los Angeles International Airport', 'city': 'Los Angeles', 'country': 'US'},
            'SFO': {'tz': 'America/Los_Angeles', 'name': 'San Francisco International Airport', 'city': 'San Francisco', 'country': 'US'},
            'SAN': {'tz': 'America/Los_Angeles', 'name': 'San Diego International Airport', 'city': 'San Diego', 'country': 'US'},
            'LAS': {'tz': 'America/Los_Angeles', 'name': 'Harry Reid International Airport', 'city': 'Las Vegas', 'country': 'US'},
            'PHX': {'tz': 'America/Phoenix', 'name': 'Phoenix Sky Harbor International Airport', 'city': 'Phoenix', 'country': 'US'},
            'SEA': {'tz': 'America/Los_Angeles', 'name': 'Seattle-Tacoma International Airport', 'city': 'Seattle', 'country': 'US'},
            'PDX': {'tz': 'America/Los_Angeles', 'name': 'Portland International Airport', 'city': 'Portland', 'country': 'US'},
            'MIA': {'tz': 'America/New_York', 'name': 'Miami International Airport', 'city': 'Miami', 'country': 'US'},
            'MCO': {'tz': 'America/New_York', 'name': 'Orlando International Airport', 'city': 'Orlando', 'country': 'US'},
            'ATL': {'tz': 'America/New_York', 'name': 'Hartsfield-Jackson Atlanta International Airport', 'city': 'Atlanta', 'country': 'US'},
            'HNL': {'tz': 'Pacific/Honolulu', 'name': 'Daniel K Inouye International Airport', 'city': 'Honolulu', 'country': 'US'},
            
            # North America - Canada
            'YYZ': {'tz': 'America/Toronto', 'name': 'Toronto Pearson International Airport', 'city': 'Toronto', 'country': 'CA'},
            'YVR': {'tz': 'America/Vancouver', 'name': 'Vancouver International Airport', 'city': 'Vancouver', 'country': 'CA'},
            'YUL': {'tz': 'America/Toronto', 'name': 'Montréal-Pierre Elliott Trudeau International Airport', 'city': 'Montreal', 'country': 'CA'},
            'YYC': {'tz': 'America/Edmonton', 'name': 'Calgary International Airport', 'city': 'Calgary', 'country': 'CA'},
            
            # Asia
            'NRT': {'tz': 'Asia/Tokyo', 'name': 'Narita International Airport', 'city': 'Tokyo', 'country': 'JP'},
            'HND': {'tz': 'Asia/Tokyo', 'name': 'Haneda Airport', 'city': 'Tokyo', 'country': 'JP'},
            'KIX': {'tz': 'Asia/Tokyo', 'name': 'Kansai International Airport', 'city': 'Osaka', 'country': 'JP'},
            'ITM': {'tz': 'Asia/Tokyo', 'name': 'Osaka International Airport', 'city': 'Osaka', 'country': 'JP'},
            'PEK': {'tz': 'Asia/Shanghai', 'name': 'Beijing Capital International Airport', 'city': 'Beijing', 'country': 'CN'},
            'PVG': {'tz': 'Asia/Shanghai', 'name': 'Shanghai Pudong International Airport', 'city': 'Shanghai', 'country': 'CN'},
            'SHA': {'tz': 'Asia/Shanghai', 'name': 'Shanghai Hongqiao International Airport', 'city': 'Shanghai', 'country': 'CN'},
            'CAN': {'tz': 'Asia/Shanghai', 'name': 'Guangzhou Baiyun International Airport', 'city': 'Guangzhou', 'country': 'CN'},
            'SZX': {'tz': 'Asia/Shanghai', 'name': 'Shenzhen Bao an International Airport', 'city': 'Shenzhen', 'country': 'CN'},
            'HKG': {'tz': 'Asia/Hong_Kong', 'name': 'Hong Kong International Airport', 'city': 'Hong Kong', 'country': 'HK'},
            'TPE': {'tz': 'Asia/Taipei', 'name': 'Taiwan Taoyuan International Airport', 'city': 'Taipei', 'country': 'TW'},
            'ICN': {'tz': 'Asia/Seoul', 'name': 'Incheon International Airport', 'city': 'Seoul', 'country': 'KR'},
            'GMP': {'tz': 'Asia/Seoul', 'name': 'Gimpo International Airport', 'city': 'Seoul', 'country': 'KR'},
            'SIN': {'tz': 'Asia/Singapore', 'name': 'Singapore Changi Airport', 'city': 'Singapore', 'country': 'SG'},
            'BKK': {'tz': 'Asia/Bangkok', 'name': 'Suvarnabhumi Airport', 'city': 'Bangkok', 'country': 'TH'},
            'DMK': {'tz': 'Asia/Bangkok', 'name': 'Don Mueang International Airport', 'city': 'Bangkok', 'country': 'TH'},
            'KUL': {'tz': 'Asia/Kuala_Lumpur', 'name': 'Kuala Lumpur International Airport', 'city': 'Kuala Lumpur', 'country': 'MY'},
            'DEL': {'tz': 'Asia/Kolkata', 'name': 'Indira Gandhi International Airport', 'city': 'Delhi', 'country': 'IN'},
            'BOM': {'tz': 'Asia/Kolkata', 'name': 'Chhatrapati Shivaji Maharaj International Airport', 'city': 'Mumbai', 'country': 'IN'},
            'DXB': {'tz': 'Asia/Dubai', 'name': 'Dubai International Airport', 'city': 'Dubai', 'country': 'AE'},
            'AUH': {'tz': 'Asia/Dubai', 'name': 'Abu Dhabi International Airport', 'city': 'Abu Dhabi', 'country': 'AE'},
            
            # Europe
            'LHR': {'tz': 'Europe/London', 'name': 'Heathrow Airport', 'city': 'London', 'country': 'GB'},
            'LGW': {'tz': 'Europe/London', 'name': 'Gatwick Airport', 'city': 'London', 'country': 'GB'},
            'STN': {'tz': 'Europe/London', 'name': 'London Stansted Airport', 'city': 'London', 'country': 'GB'},
            'CDG': {'tz': 'Europe/Paris', 'name': 'Charles de Gaulle Airport', 'city': 'Paris', 'country': 'FR'},
            'ORY': {'tz': 'Europe/Paris', 'name': 'Orly Airport', 'city': 'Paris', 'country': 'FR'},
            'FRA': {'tz': 'Europe/Berlin', 'name': 'Frankfurt Airport', 'city': 'Frankfurt', 'country': 'DE'},
            'MUC': {'tz': 'Europe/Berlin', 'name': 'Munich Airport', 'city': 'Munich', 'country': 'DE'},
            'AMS': {'tz': 'Europe/Amsterdam', 'name': 'Amsterdam Airport Schiphol', 'city': 'Amsterdam', 'country': 'NL'},
            'FCO': {'tz': 'Europe/Rome', 'name': 'Leonardo da Vinci-Fiumicino Airport', 'city': 'Rome', 'country': 'IT'},
            'MXP': {'tz': 'Europe/Rome', 'name': 'Malpensa Airport', 'city': 'Milan', 'country': 'IT'},
            'MAD': {'tz': 'Europe/Madrid', 'name': 'Adolfo Suárez Madrid-Barajas Airport', 'city': 'Madrid', 'country': 'ES'},
            'BCN': {'tz': 'Europe/Madrid', 'name': 'Barcelona-El Prat Airport', 'city': 'Barcelona', 'country': 'ES'},
            'ZRH': {'tz': 'Europe/Zurich', 'name': 'Zurich Airport', 'city': 'Zurich', 'country': 'CH'},
            'VIE': {'tz': 'Europe/Vienna', 'name': 'Vienna International Airport', 'city': 'Vienna', 'country': 'AT'},
            'IST': {'tz': 'Europe/Istanbul', 'name': 'Istanbul Airport', 'city': 'Istanbul', 'country': 'TR'},
            
            # Oceania
            'SYD': {'tz': 'Australia/Sydney', 'name': 'Sydney Kingsford Smith Airport', 'city': 'Sydney', 'country': 'AU'},
            'MEL': {'tz': 'Australia/Melbourne', 'name': 'Melbourne Airport', 'city': 'Melbourne', 'country': 'AU'},
            'BNE': {'tz': 'Australia/Brisbane', 'name': 'Brisbane Airport', 'city': 'Brisbane', 'country': 'AU'},
            'PER': {'tz': 'Australia/Perth', 'name': 'Perth Airport', 'city': 'Perth', 'country': 'AU'},
            'AKL': {'tz': 'Pacific/Auckland', 'name': 'Auckland Airport', 'city': 'Auckland', 'country': 'NZ'},
            'WLG': {'tz': 'Pacific/Auckland', 'name': 'Wellington International Airport', 'city': 'Wellington', 'country': 'NZ'},
            
            # South America
            'GRU': {'tz': 'America/Sao_Paulo', 'name': 'São Paulo-Guarulhos International Airport', 'city': 'São Paulo', 'country': 'BR'},
            'GIG': {'tz': 'America/Sao_Paulo', 'name': 'Rio de Janeiro-Galeão International Airport', 'city': 'Rio de Janeiro', 'country': 'BR'},
            'EZE': {'tz': 'America/Argentina/Buenos_Aires', 'name': 'Ministro Pistarini International Airport', 'city': 'Buenos Aires', 'country': 'AR'},
            'SCL': {'tz': 'America/Santiago', 'name': 'Arturo Merino Benítez International Airport', 'city': 'Santiago', 'country': 'CL'},
        }
        
        self.airports = builtin_airports
        print(f"✓ Loaded {len(self.airports)} airports from built-in database")
    
    def load_cache(self):
        """Load additional airports from cache."""
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
            
            # Merge cache with existing data
            for code, data in cached_data.items():
                if code.upper() not in self.airports:
                    self.airports[code.upper()] = data
            
            print(f"✓ Loaded {len(cached_data)} airports from cache")
        except Exception as e:
            print(f"Note: Could not load cache: {e}")
    
    def save_cache(self):
        """Save custom airports to cache."""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.airports, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Note: Could not save cache: {e}")
    
    def get_timezone(self, airport_code, ask_if_missing=True):
        """Get timezone for airport code."""
        airport_code = airport_code.upper()
        
        # Check if we have this airport
        if airport_code in self.airports:
            tz = self.airports[airport_code].get('tz', '')
            if tz:
                return tz
        
        # Airport not found, ask user
        if ask_if_missing:
            print(f"\n⚠️  Airport '{airport_code}' not found in database.")
            print("Please enter the timezone for this airport.")
            print("Common examples: America/New_York, Asia/Tokyo, Europe/London")
            print("You can find timezone names at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones")
            
            while True:
                tz = input(f"Enter timezone for {airport_code} (or press Enter for UTC): ").strip()
                
                if not tz:
                    tz = 'UTC'
                
                # Validate timezone
                try:
                    ZoneInfo(tz)
                    
                    # Save this airport to cache for future use
                    self.airports[airport_code] = {
                        'tz': tz,
                        'name': f'Custom Airport ({airport_code})',
                        'city': 'Unknown',
                        'country': 'Unknown'
                    }
                    
                    if self.use_cache:
                        self.save_cache()
                    
                    return tz
                except Exception:
                    print(f"Invalid timezone: {tz}. Please try again.")
        
        return 'UTC'
    
    def get_airport_info(self, airport_code):
        """Get complete airport information."""
        airport_code = airport_code.upper()
        info = self.airports.get(airport_code, {})
        
        # If airport not found, create minimal info
        if not info:
            info = {
                'name': f'Airport {airport_code}',
                'city': 'Unknown',
                'country': 'Unknown',
                'tz': 'UTC'
            }
        
        return info

def create_flight_ics(flight_data, airport_db):
    """Create an .ics file from flight data."""
    
    # Generate a unique ID for the event
    flight_id = flight_data['flight_number'].replace(" ", "-").replace("/", "-").lower()
    date_str = flight_data['departure_time'].strftime("%Y%m%d")
    uid = f"flight-{flight_id}-{date_str}@python-script"
    
    # Format times for .ics
    dtstamp = datetime.now().strftime("%Y%m%dT%H%M%SZ")
    dep_time = flight_data['departure_time'].strftime("%Y%m%dT%H%M%S")
    arr_time = flight_data['arrival_time'].strftime("%Y%m%dT%H%M%S")
    
    # Get airport info
    dep_info = airport_db.get_airport_info(flight_data['departure_airport'])
    arr_info = airport_db.get_airport_info(flight_data['arrival_airport'])
    
    # Calculate duration
    duration = flight_data['arrival_time'] - flight_data['departure_time']
    hours = duration.days * 24 + duration.seconds // 3600
    minutes = (duration.seconds % 3600) // 60
    
    if hours > 0 and minutes > 0:
        duration_str = f"{hours}h {minutes}m"
    elif hours > 0:
        duration_str = f"{hours}h"
    else:
        duration_str = f"{minutes}m"
    
    # Build description
    description = f"""Flight: {flight_data['flight_number']}
Passenger: {flight_data['passenger_name']}
Depart: {flight_data['departure_time'].strftime('%Y-%m-%d %I:%M %p')} ({flight_data['departure_timezone']})
Arrive: {flight_data['arrival_time'].strftime('%Y-%m-%d %I:%M %p')} ({flight_data['arrival_timezone']})
Duration: {duration_str}
Seat: {flight_data.get('seat', 'Not assigned')}
Class: {flight_data.get('class', 'Not specified')}
Baggage: {flight_data.get('baggage', 'Not specified')}"""
    
    # Replace newlines with \\n for .ics format
    description = description.replace('\n', '\\n')
    
    # Build .ics content
    ics_content = f"""BEGIN:VEVENT
UID:{uid}
DTSTAMP:{dtstamp}
SUMMARY:✈️ {flight_data['flight_number']} {flight_data['departure_airport']} → {flight_data['arrival_airport']}
DTSTART;TZID={flight_data['departure_timezone']}:{dep_time}
DTEND;TZID={flight_data['arrival_timezone']}:{arr_time}
LOCATION:{dep_info.get('name', flight_data['departure_airport'])} → {arr_info.get('name', flight_data['arrival_airport'])}
DESCRIPTION:{description}
END:VEVENT"""
    
    return ics_content

def main():
    """Main function to create flight calendar events."""
    
    print("=" * 60)
    print("FLIGHT CALENDAR GENERATOR")
    print("Using airportsdata package for comprehensive airport information")
    print("=" * 60)
    
    # Check if airportsdata is available
    if not AIRPORTSDATA_AVAILABLE:
        print("\n⚠️  The 'airportsdata' package is not installed.")
        print("The script will use a limited built-in airport database.")
        print("\nFor complete airport coverage, install airportsdata:")
        print("  pip install airportsdata")
        print("\nPress Enter to continue with built-in database...")
        input()
    
    # Initialize airport database
    print("\nInitializing airport database...")
    airport_db = AirportDatabase(use_cache=True)
    
    flights = []
    
    # Collect flight information
    print("\n" + "=" * 60)
    print("ENTER FLIGHT INFORMATION")
    print("=" * 60)
    
    while True:
        print(f"\n📋 FLIGHT {len(flights) + 1}")
        print("-" * 40)
        
        # Get basic flight info
        flight_number = input("Flight number (e.g., HA850, NH976): ").strip()
        passenger_name = input("Passenger name: ").strip()
        
        # Get departure information
        print("\n🛫 DEPARTURE")
        departure_airport = input("Departure airport code (e.g., KIX, JFK): ").strip().upper()
        departure_timezone = airport_db.get_timezone(departure_airport)
        departure_info = airport_db.get_airport_info(departure_airport)
        
        print(f"  Airport: {departure_info.get('name', 'Unknown')}")
        print(f"  Location: {departure_info.get('city', 'Unknown')}, {departure_info.get('country', 'Unknown')}")
        print(f"  Timezone: {departure_timezone}")
        
        departure_time_str = input("Departure date & time (YYYY-MM-DD HH:MM): ").strip()
        try:
            departure_dt = datetime.strptime(departure_time_str, "%Y-%m-%d %H:%M")
            departure_dt = departure_dt.replace(tzinfo=ZoneInfo(departure_timezone))
        except ValueError:
            print("❌ Invalid date/time format. Please use YYYY-MM-DD HH:MM")
            continue
        
        # Get arrival information
        print("\n🛬 ARRIVAL")
        arrival_airport = input("Arrival airport code (e.g., HNL, LAX): ").strip().upper()
        arrival_timezone = airport_db.get_timezone(arrival_airport)
        arrival_info = airport_db.get_airport_info(arrival_airport)
        
        print(f"  Airport: {arrival_info.get('name', 'Unknown')}")
        print(f"  Location: {arrival_info.get('city', 'Unknown')}, {arrival_info.get('country', 'Unknown')}")
        print(f"  Timezone: {arrival_timezone}")
        
        arrival_time_str = input("Arrival date & time (YYYY-MM-DD HH:MM): ").strip()
        try:
            arrival_dt = datetime.strptime(arrival_time_str, "%Y-%m-%d %H:%M")
            arrival_dt = arrival_dt.replace(tzinfo=ZoneInfo(arrival_timezone))
        except ValueError:
            print("❌ Invalid date/time format. Please use YYYY-MM-DD HH:MM")
            continue
        
        # Get optional details
        print("\n📝 ADDITIONAL DETAILS (optional)")
        seat = input("Seat assignment: ").strip() or "Not assigned"
        flight_class = input("Class (Economy/Business/First): ").strip() or "Economy"
        baggage = input("Baggage allowance: ").strip() or "Not specified"
        
        # Store flight data
        flight_data = {
            'flight_number': flight_number,
            'passenger_name': passenger_name,
            'departure_airport': departure_airport,
            'departure_timezone': departure_timezone,
            'departure_time': departure_dt,
            'arrival_airport': arrival_airport,
            'arrival_timezone': arrival_timezone,
            'arrival_time': arrival_dt,
            'seat': seat,
            'class': flight_class,
            'baggage': baggage
        }
        
        flights.append(flight_data)
        
        # Ask if user wants to add another flight
        print("\n" + "-" * 40)
        add_more = input("Add another flight? (y/n): ").strip().lower()
        if add_more not in ['y', 'yes']:
            break
    
    # Generate .ics file
    if not flights:
        print("\n❌ No flights entered. Exiting.")
        return
    
    # Create .ics content
    ics_content = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Flight Calendar Generator//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
"""
    
    for flight_data in flights:
        event_content = create_flight_ics(flight_data, airport_db)
        ics_content += event_content + "\n"
    
    ics_content += "END:VCALENDAR"
    
    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"flights_{timestamp}.ics"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(ics_content)
    
    # Print summary
    print("\n" + "=" * 60)
    print("✅ SUCCESS!")
    print("=" * 60)
    print(f"\n📁 Calendar file created: {filename}")
    print(f"📊 Contains {len(flights)} flight(s)")
    
    print("\n📅 FLIGHT SUMMARY:")
    for i, flight in enumerate(flights, 1):
        dep_info = airport_db.get_airport_info(flight['departure_airport'])
        arr_info = airport_db.get_airport_info(flight['arrival_airport'])
        
        print(f"\n  Flight {i}: {flight['flight_number']}")
        print(f"    {flight['departure_airport']} ({dep_info.get('city', 'Unknown')}) → {flight['arrival_airport']} ({arr_info.get('city', 'Unknown')})")
        print(f"    Depart: {flight['departure_time'].strftime('%Y-%m-%d %I:%M %p %Z')}")
        print(f"    Arrive: {flight['arrival_time'].strftime('%Y-%m-%d %I:%M %p %Z')}")
    
    print("\n📲 HOW TO IMPORT:")
    print("1. Google Calendar: Settings → Import & Export → Select file")
    print("2. Outlook: Calendar → Add Calendar → From File")
    print("3. Apple Calendar: File → Import → Select .ics file")
    print(f"\nFile location: {os.path.abspath(filename)}")

def install_packages():
    """Install required packages if not available."""
    if not AIRPORTSDATA_AVAILABLE:
        print("\nThe 'airportsdata' package provides comprehensive airport information")
        print("including timezones for airports worldwide.")
        print("\ninstall 'airportsdata' to use all airports information ")
        print("\nNow this script will use internal limited airport database.")

    else:
        print("Reading airport database...")

if __name__ == "__main__":
    # Check and install required packages
    install_packages()
    
    # Run main program
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        print("Please make sure you're using Python 3.9 or later.")