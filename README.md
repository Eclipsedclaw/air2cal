# air2cal
Airplane to calendar! generate ics calendar file based on your flight information so you will never miss your time! 

## Webb usage: [https://eclipsedclaw.github.io/air2cal/](https://eclipsedclaw.github.io/air2cal/)
<br/><br/>

# history python script

generate from airflight tickects information to calendar ics file. It will require Flight number, Passenger name, Departure airport code, Departure date & time in the format of YYYY-MM-DD HH:MM, Arrival airport code, Arrival date & time in the format of YYYY-MM-DD HH:MM). Some optional information as Seat assignment, Class (Economy/Business/First) and Baggage allowance. The timezone will be auto adjusted.


## Required package
This simple script will need 'airportsdata' to convert all airport code, and 'zoneinfo' get the timezone difference respectively. If you don't have 'airportsdata' then it will use an internal small database.

## To use the script
Simple as run:
```bash
python3 main.py
```

One example of generating process demonstrated as below:

<img width="528" height="1155" alt="Screenshot 2026-01-19 at 12 29 33 PM" src="https://github.com/user-attachments/assets/850cf334-c4f9-4f13-b283-3dd5769dcbe7" />

After imported the ics file to outlook calendar it will look like this:

<img width="878" height="415" alt="Screenshot 2026-01-19 at 12 36 47 PM" src="https://github.com/user-attachments/assets/d1ba3706-975f-4232-b68e-ab20474720dc" />
