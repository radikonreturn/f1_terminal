import urllib.request
import json

base = "https://api.jolpi.ca/ergast/f1"
code = "VER"

# 1. Get current drivers to map code to driverId
req = urllib.request.urlopen(f"{base}/current/drivers.json")
data = json.loads(req.read().decode())
drivers = data["MRData"]["DriverTable"]["Drivers"]

driver_id = None
for d in drivers:
    if d.get("code") == code:
        driver_id = d["driverId"]
        break

if driver_id:
    # 2. Get wins
    req = urllib.request.urlopen(f"{base}/drivers/{driver_id}/results/1.json?limit=1")
    wins_data = json.loads(req.read().decode())
    wins = wins_data["MRData"]["total"]
    
    # 3. Get championships? ERGAST /driverStandings/1.json fails on Jolpi, let's just get driverStandings and see the last round of each season
    req = urllib.request.urlopen(f"{base}/drivers/{driver_id}/driverStandings.json?limit=100")
    stand_data = json.loads(req.read().decode())
    lists = stand_data["MRData"]["StandingsTable"]["StandingsLists"]
    champs = 0
    # A true champion is #1 in the final round. Ergast normally gives the final round if no round is specified.
    # Actually, in Ergast, /drivers/{id}/driverStandings.json gives 1 standing per season (the final one).
    for lst in lists:
        if lst["DriverStandings"][0]["position"] == "1":
            champs += 1
            
    print(f"Driver: {driver_id}, Wins: {wins}, Champs: {champs}")
else:
    print("Not found")
