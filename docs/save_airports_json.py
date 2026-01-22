# save_airports_json.py
# Run this where airportsdata is installed (e.g., your dev machine / CI).
import json
import airportsdata
from pathlib import Path

out_path = Path("docs/airports.json")  # or wherever your Pages assets live
out_path.parent.mkdir(parents=True, exist_ok=True)

def build_iata_map():
    iata = airportsdata.load('IATA')
    icao = airportsdata.load('ICAO')
    out = {}
    for code, data in iata.items():
        if not code or len(code) != 3:
            continue
        out[code.upper()] = {
            "name": data.get("name", ""),
            "city": data.get("city", ""),
            "country": data.get("country", ""),
            "tz": data.get("tz", ""),   # timezone string (IANA)
            "lat": data.get("lat", None),
            "lon": data.get("lon", None),
            "icao": data.get("icao", "")
        }
    # add ICAO entries that include an IATA code missing above
    for code, data in icao.items():
        iata_code = data.get("iata", "")
        if iata_code and iata_code.upper() not in out:
            out[iata_code.upper()] = {
                "name": data.get("name", ""),
                "city": data.get("city", ""),
                "country": data.get("country", ""),
                "tz": data.get("tz", ""),
                "lat": data.get("lat", None),
                "lon": data.get("lon", None),
                "icao": code
            }
    return out

print("Building airports JSON (can take a few seconds)...")
m = build_iata_map()

# Optional: you can trim to only entries with tz or top N airports to reduce size.
# Example — keep only airports with timezone:
m_trimmed = {k:v for k,v in m.items() if v.get("tz")}

print(f"Exporting {len(m_trimmed)} airports to {out_path}")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(m_trimmed, f, ensure_ascii=False, indent=2)
print("Done.")