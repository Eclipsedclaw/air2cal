## air2cal
generate from airflight tickects information to calendar ics file. It will require Flight number, Passenger name, Departure airport code, Departure date & time in the format of YYYY-MM-DD HH:MM, Arrival airport code, Arrival date & time in the format of YYYY-MM-DD HH:MM). Some optional information as Seat assignment, Class (Economy/Business/First) and Baggage allowance.

# Required package
This simple script will need 'airportsdata' to convert all airport code, and 'zoneinfo' get the timezone difference respectively. If you don't have 'airportsdata' then it will use an internal small database.

# To use the script
Simple as run:
```bash
python3 main.py
```
