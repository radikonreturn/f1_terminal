#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import sys
import os
import time
from datetime import datetime, timezone, timedelta

# Force UTF-8 encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass


# --- CONFIGURATION ---
BASE_URL = "https://api.jolpi.ca/ergast/f1"
SEASON = "2026"
TIMEOUT = 10

# --- COLOR SYSTEM ---
class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    UNDER   = "\033[4m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"

def supports_color():
    if os.environ.get("NO_COLOR"):
        return False
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            # Enable VT100 mode on Windows 10+
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            return True
        except Exception:
            return False
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()

USE_COLOR = supports_color()

def c(color, text):
    if USE_COLOR:
        return color + str(text) + C.RESET
    return str(text)

# --- UTILITIES ---
def pad(text, length, right=False):
    s = str(text) if text is not None else ""
    if right:
        return s.rjust(length)[:length]
    return s.ljust(length)[:length]

def team_color(name):
    lower_name = str(name).lower()
    if 'red bull' in lower_name: return C.BLUE
    if 'ferrari' in lower_name: return C.RED
    if 'mercedes' in lower_name: return C.CYAN
    if 'mclaren' in lower_name: return C.YELLOW
    if 'aston martin' in lower_name: return C.GREEN
    if 'alpine' in lower_name: return C.MAGENTA
    return C.GREEN

def get_flag(nationality):
    flags = {
        'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Spanish': '🇪🇸',
        'Australian': '🇦🇺', 'Mexican': '🇲🇽', 'French': '🇫🇷', 'Japanese': '🇯🇵',
        'Canadian': '🇨🇦', 'German': '🇩🇪', 'Thai': '🇹🇭', 'Danish': '🇩🇰',
        'Finnish': '🇫🇮', 'Chinese': '🇨🇳', 'American': '🇺🇸', 'New Zealander': '🇳🇿',
        'Italian': '🇮🇹', 'Austrian': '🇦🇹', 'Swiss': '🇨🇭', 'Swiss-French': '🇨🇭'
    }
    return flags.get(nationality, '🏁')

def get_race_flag(country):
    flags = {
        'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
        'China': '🇨🇳', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Italy': '🇮🇹',
        'Monaco': '🇲🇨', 'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹',
        'UK': '🇬🇧', 'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱',
        'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
        'Qatar': '🇶🇦', 'UAE': '🇦🇪'
    }
    return flags.get(country, '🏁')

# --- HTTP LAYER ---
def api_fetch(endpoint, label="Fetching data"):
    url = "{}{}".format(BASE_URL, endpoint)
    
    spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    
    def print_spin(i):
        msg = "{} {}...".format(c(C.CYAN, spinner[i % len(spinner)]), label)
        sys.stdout.write("\r" + msg + " " * 10)
        sys.stdout.flush()

    try:
        from urllib.request import Request, urlopen
        import ssl
        from threading import Thread
        
        req = Request(url, headers={'User-Agent': 'F1TerminalCLI/1.0'})
        res = None
        err = None
        done = False
        
        # NOTE: SSL verification is disabled for Jolpi API compatibility on some
        # systems. The API is a public read-only endpoint with no credentials involved.
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        def worker():
            nonlocal res, err, done
            try:
                with urlopen(req, timeout=TIMEOUT, context=ctx) as response:
                    if response.status != 200:
                        err = Exception("HTTP {}: {}".format(response.status, response.reason))
                    else:
                        res = json.loads(response.read().decode('utf-8'))
            except Exception as e:
                err = e
            finally:
                done = True
                
        t = Thread(target=worker)
        t.daemon = True
        t.start()
        
        i = 0
        while not done:
            print_spin(i)
            time.sleep(0.1)
            i += 1
            
        sys.stdout.write("\r" + " " * 60 + "\r") # Clear spinner
        sys.stdout.flush()
        
        if err is not None:
            raise err
            
        return res
        
    except urllib.error.URLError as e:
        if "getaddrinfo failed" in str(e.reason):
            print(c(C.RED, "\n[ERROR] DNS Error: Cannot resolve '{}'. The API might be down or your internet is offline.".format(BASE_URL)))
        else:
            print(c(C.RED, "\n[ERROR] Network error: {}".format(e.reason)))
        sys.exit(1)
    except json.JSONDecodeError:
        print(c(C.RED, "\n[ERROR] Invalid response from API."))
        sys.exit(1)
    except Exception as e:
        print(c(C.RED, "\n[ERROR] Failed to fetch data: {}".format(str(e))))
        sys.exit(1)

# --- COMMAND HANDLERS ---
def _print_header(title):
    print("\n" + c(C.BOLD + C.YELLOW, "═" * 60))
    print(c(C.BOLD + C.WHITE, "  🏎️  " + title.upper()))
    print(c(C.BOLD + C.YELLOW, "═" * 60))

def cmd_standings():
    _print_header("Driver Standings {}".format(SEASON))
    data = api_fetch("/{}/driverStandings.json".format(SEASON), "Fetching standings")
    try:
        table = data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
        
        print((c(C.DIM, "POS {pos} DRIVER {driver} TEAM {team} PTS").format(
            pos=pad("", 2),
            driver=pad("", 15),
            team=pad("", 15)
        )))
        
        for d in table:
            pos = d.get("position", d.get("positionText", "-"))
            pts = d.get("points", "0")
            driver = d["Driver"]
            team = d["Constructors"][0] if d["Constructors"] else {"name": "Unknown"}
            
            name = "{} {}".format(driver["givenName"][0], driver["familyName"])
            team_colored = c(team_color(team["name"]), team["name"])
            
            val_medal = ""
            if pos == "1": val_medal = c(C.YELLOW, "🥇")
            elif pos == "2": val_medal = c(C.WHITE, "🥈")
            elif pos == "3": val_medal = c(C.RED, "🥉")
            else: val_medal = pad("", 2)
            
            print("{pos_pad} {medal} {name_pad} {team_pad} {pts_pad}".format(
                pos_pad=c(C.BOLD, pad(pos, 2, right=True)),
                medal=val_medal,
                name_pad=c(C.WHITE, pad(name, 19)),
                team_pad=pad(team_colored, 28), # ANSI chars add logic, pad manually handles length vs visual
                pts_pad=c(C.GREEN + C.BOLD, pad(pts, 4, right=True))
            ))
            
    except IndexError:
        print(c(C.RED, "No standings data found for {}.".format(SEASON)))

def cmd_constructors():
    _print_header("Constructor Standings {}".format(SEASON))
    data = api_fetch("/{}/constructorStandings.json".format(SEASON), "Fetching constructors")
    try:
        table = data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]
        
        print((c(C.DIM, "POS {pos} TEAM {team} NAT {nat} WINS {wins} PTS").format(
            pos=pad("", 2),
            team=pad("", 15),
            nat=pad("", 5),
            wins=pad("", 2)
        )))
        
        for c_val in table:
            pos = c_val.get("position", c_val.get("positionText", "-"))
            pts = c_val.get("points", "0")
            wins = c_val.get("wins", "0")
            team = c_val["Constructor"]
            
            team_colored = c(team_color(team["name"]), team["name"])
            flag = get_flag(team["nationality"])
            
            val_medal = ""
            if pos == "1": val_medal = c(C.YELLOW, "🥇")
            elif pos == "2": val_medal = c(C.WHITE, "🥈")
            elif pos == "3": val_medal = c(C.RED, "🥉")
            else: val_medal = pad("", 2)
            
            print("{pos_pad} {medal} {team_pad} {flag_pad} {wins_pad}  {pts_pad}".format(
                pos_pad=c(C.BOLD, pad(pos, 2, right=True)),
                medal=val_medal,
                team_pad=pad(team_colored, 28),
                flag_pad=pad(flag, 4),
                wins_pad=pad(wins, 4, right=True),
                pts_pad=c(C.GREEN + C.BOLD, pad(pts, 4, right=True))
            ))
            
    except IndexError:
        print("No constructors data found.")

def cmd_schedule():
    _print_header("Race Schedule {}".format(SEASON))
    data = api_fetch("/{}.json".format(SEASON), "Fetching schedule")
    try:
        races = data["MRData"]["RaceTable"]["Races"]
        
        for r in races:
            rnd = r["round"]
            name = r["raceName"]
            circuit = r["Circuit"]["circuitName"]
            loc = r["Circuit"]["Location"]
            date = r["date"]
            time_str = r.get("time", "TBD")
            
            if time_str != "TBD":
                time_str_clean = time_str.replace("Z", "")
                dt_str = "{}T{}Z".format(date, time_str_clean)
                r_dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
                local_dt = r_dt.astimezone(timezone(timedelta(hours=3)))
                date = local_dt.strftime("%Y-%m-%d")
                time_str = local_dt.strftime("%H:%M (UTC+3)")
            else:
                time_str = time_str.replace("Z", "")
            
            flag = get_race_flag(loc["country"])
            
            print("{rnd_pad}. {flag} {name_pad} {date_pad} {time_pad}".format(
                rnd_pad=c(C.DIM, pad(rnd, 2, right=True)),
                flag=flag,
                name_pad=c(C.WHITE + C.BOLD, pad(name, 30)),
                date_pad=c(C.CYAN, pad(date, 12)),
                time_pad=c(C.DIM, time_str)
            ))
            print("       {}\n".format(c(C.DIM, pad(circuit + ", " + loc["locality"], 40))))
            
    except Exception as e:
        print("Error parsing schedule:", e)

def cmd_last():
    _print_header("Last Race Results")
    data = api_fetch("/current/last/results.json", "Fetching last race")
    
    # If the current season hasn't started, fetch the last race of the previous season
    try:
        if len(data["MRData"]["RaceTable"]["Races"]) == 0:
            current_season = int(data["MRData"]["RaceTable"]["season"])
            prev_season = current_season - 1
            data = api_fetch(f"/{prev_season}/last/results.json", f"Fetching last race of {prev_season}")
    except KeyError:
        pass

    try:
        race_info = data["MRData"]["RaceTable"]["Races"][0]
        race_name = race_info["raceName"]
        results = race_info["Results"]
        
        print(c(C.CYAN, "Season {} Round {}: {}\n".format(race_info["season"], race_info["round"], race_name)))
        
        print(c(C.DIM, "POS {pos} DRIVER               TEAM                 TIME/STATUS").format(
            pos=pad("", 3)
        ))
        
        for res in results:
            pos = res["position"]
            driver = res["Driver"]
            team = res["Constructor"]
            status = res["status"]
            
            name = "{} {}".format(driver["givenName"][0], driver["familyName"])
            team_colored = c(team_color(team["name"]), team["name"])
            
            time_str = status
            if "Time" in res:
                time_str = res["Time"]["time"]
                
            print("{pos_pad} {name_pad} {team_pad} {time_pad}".format(
                pos_pad=c(C.BOLD, pad(pos, 3, right=True)),
                name_pad=c(C.WHITE, pad(name, 20)),
                team_pad=pad(team_colored, 28),
                time_pad=c(C.GREEN if "Laps" not in time_str and "Finished" not in time_str else C.DIM, time_str)
            ))
            
    except IndexError:
        print("No recent race results found.")

def cmd_next():
    _print_header("Next Race")
    data = api_fetch("/current.json", "Fetching schedule")
    try:
        races = data["MRData"]["RaceTable"]["Races"]
        now = datetime.now(timezone.utc)
        
        next_race = None
        race_dt = None
        for r in races:
            date_str = r["date"]
            time_str = r.get("time", "00:00:00Z")
            dt_str = "{}T{}".format(date_str, time_str)
            r_dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
            if r_dt > now:
                next_race = r
                race_dt = r_dt
                break
                
        if next_race:
            name = next_race["raceName"]
            circuit = next_race["Circuit"]["circuitName"]
            loc = next_race["Circuit"]["Location"]
            flag = get_race_flag(loc["country"])
            
            diff = race_dt - now
            days = diff.days
            hours, remainder = divmod(diff.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            
            local_dt = race_dt.astimezone(timezone(timedelta(hours=3)))

            print("{} {}".format(flag, c(C.BOLD + C.WHITE, name)))
            print(c(C.DIM, "Location: {}, {}".format(circuit, loc['locality'])))
            print(c(C.CYAN, "Date:     {} at {} UTC+3".format(local_dt.strftime("%Y-%m-%d"), local_dt.strftime("%H:%M"))))
            print(c(C.YELLOW + C.BOLD, "Starts in: {}d {}h {}m\n".format(days, hours, minutes)))
        else:
            print("No upcoming races found for this season.")
            
    except Exception as e:
        print("Error finding next race:", e)

def cmd_drivers():
    _print_header("Drivers {}".format(SEASON))
    data = api_fetch("/{}/drivers.json".format(SEASON), "Fetching drivers")
    s_data = api_fetch("/{}/driverStandings.json".format(SEASON), "Fetching teams")
    
    FALLBACK_TEAMS = {
        "albon": "Williams", "alonso": "Aston Martin", "antonelli": "Mercedes", 
        "bearman": "Haas", "bortoleto": "Sauber", "bottas": "Sauber", 
        "colapinto": "Williams", "gasly": "Alpine", "hadjar": "RB", 
        "hamilton": "Ferrari", "hulkenberg": "Sauber", "lawson": "RB", 
        "leclerc": "Ferrari", "lindblad": "RB", "norris": "McLaren", "ocon": "Haas", 
        "piastri": "McLaren", "perez": "Red Bull", "russell": "Mercedes", 
        "sainz": "Williams", "stroll": "Aston Martin", "max_verstappen": "Red Bull", 
        "tsunoda": "RB", "doohan": "Alpine"
    }
    
    team_map = {}
    try:
        lists = s_data["MRData"]["StandingsTable"]["StandingsLists"]
        if lists:
            for d in lists[0]["DriverStandings"]:
                team_map[d["Driver"]["driverId"]] = d["Constructors"][0]["name"]
    except (KeyError, IndexError, TypeError):
        pass

    try:
        drivers = data["MRData"]["DriverTable"]["Drivers"]
        
        print((c(C.DIM, "NO {no} DRIVER {driver} TEAM {team_pad} NAT {nat} CODE").format(
            no=pad("", 1),
            driver=pad("", 16),
            team_pad=pad("", 15),
            nat=pad("", 3)
        )))
        
        for d in drivers:
            no = d.get("permanentNumber", "N/A")
            name = "{} {}".format(d["givenName"], d["familyName"])
            nat = d["nationality"]
            flag = get_flag(nat)
            code = d.get("code", "N/A")
            d_id = d["driverId"]
            
            team_name = team_map.get(d_id, FALLBACK_TEAMS.get(d_id, "Unknown"))
            team_colored = c(team_color(team_name), team_name)
            
            print("{no_pad} {name_pad} {team_str} {flag_pad} {code_pad}".format(
                no_pad=c(C.BOLD, pad(no, 3, right=True)),
                name_pad=c(C.WHITE, pad(name, 23)),
                team_str=pad(team_colored, 28),
                flag_pad=pad(flag, 4),
                code_pad=c(C.CYAN, pad(code, 4))
            ))
            
    except Exception as e:
        print("Error parsing drivers:", e)

def cmd_pilot(code=None):
    if not code:
        print(c(C.RED, "Please provide a pilot 3-letter code. (e.g. 'python f1.py pilot VER')"))
        return
        
    code = code.upper()
    _print_header(f"Pilot Profile: {code}")
    
    # 1. Fetch current drivers to find ID
    data = api_fetch("/current/drivers.json", f"Searching for {code}")
    try:
        drivers = data["MRData"]["DriverTable"]["Drivers"]
        driver = next((d for d in drivers if d.get("code") == code), None)
        
        if not driver:
            # Fallback: maybe they entered a driverId directly
            driver_id = code.lower()
            try:
                # Test if it exists
                single_data = api_fetch(f"/drivers/{driver_id}.json", "Validating ID")
                if single_data["MRData"]["total"] == "0":
                    print(c(C.RED, f"Driver '{code}' not found in active grid. Use full driverId for historical pilots."))
                    return
                driver = single_data["MRData"]["DriverTable"]["Drivers"][0]
            except (KeyError, IndexError, Exception):
                print(c(C.RED, f"Driver '{code}' not found."))
                return
        else:
            driver_id = driver["driverId"]
        name = f"{driver['givenName']} {driver['familyName']}"
        nat = get_flag(driver["nationality"])
        number = driver.get("permanentNumber", "N/A")
        
        # known world championships mapping
        wdc = {
            "michael_schumacher": 7, "hamilton": 7, "fangio": 5, "prost": 4, 
            "vettel": 4, "max_verstappen": 4, "brabham": 3, "stewart": 3, 
            "lauda": 3, "piquet": 3, "senna": 3, "alonso": 2, "hakkinen": 2,
            "fittipaldi": 2, "clark": 2, "ascari": 2, "raikkonen": 1, "rosberg": 1, 
            "nico_rosberg": 1, "button": 1, "villeneuve": 1, "damon_hill": 1, 
            "mansell": 1, "andretti": 1, "hunt": 1, "scheckter": 1, "jones": 1, 
            "surtees": 1, "phil_hill": 1, "hawthorn": 1, "farina": 1
        }
        
        # 2. Fetch all-time stats
        wins_data = api_fetch(f"/drivers/{driver_id}/results/1.json?limit=1", "Fetching Wins")
        poles_data = api_fetch(f"/drivers/{driver_id}/qualifying/1.json?limit=1", "Fetching Poles")
        starts_data = api_fetch(f"/drivers/{driver_id}/results.json?limit=1", "Fetching Starts")
        
        total_wins = wins_data["MRData"]["total"]
        total_poles = poles_data["MRData"]["total"]
        total_starts = starts_data["MRData"]["total"]
        total_champs = wdc.get(driver_id, 0)
        
        print()
        print(f" {nat} {c(C.BOLD + C.WHITE, name)}  |  #{number}  |  {driver['dateOfBirth']}")
        print(c(C.DIM, " " + "-"*40))
        print(f" {c(C.YELLOW, 'World Championships:')}  {c(C.BOLD, total_champs)}")
        print(f" {c(C.GREEN, 'All-Time Wins:')}        {c(C.BOLD, total_wins)}")
        print(f" {c(C.CYAN, 'Pole Positions:')}       {c(C.BOLD, total_poles)}")
        print(f" {c(C.DIM, 'Race Starts:')}          {c(C.BOLD, total_starts)}\n")
        
    except Exception as e:
        print("Error fetching pilot data:", e)

def cmd_help():
    _print_header("F1 Terminal CLI - Help")
    print(c(C.BOLD, "Available commands:"))
    print("  {} - Show driver standings".format(c(C.GREEN, "standings")))
    print("  {}   - Show all drivers/pilots grid".format(c(C.GREEN, "drivers")))
    print("  {} - Show constructor standings".format(c(C.GREEN, "constructors")))
    print("  {} - Show race schedule".format(c(C.GREEN, "schedule")))
    print("  {} - Show next upcoming race and countdown".format(c(C.GREEN, "next")))
    print("  {} - Show last race results".format(c(C.GREEN, "last")))
    print("  {} VER  - Show historical stats for a pilot".format(c(C.GREEN, "pilot")))
    print("  {}      - Exit interactive mode".format(c(C.RED, "exit/quit")))
    print()

def dispatch(cmd_name, args):
    table = {
        "standings": cmd_standings,
        "drivers": cmd_drivers,
        "constructors": cmd_constructors,
        "schedule": cmd_schedule,
        "next": cmd_next,
        "last": cmd_last,
        "pilot": cmd_pilot,
        "help": cmd_help,
        "quit": sys.exit,
        "exit": sys.exit
    }
    
    fn = table.get(cmd_name.lower())
    if fn:
        try:
            fn(*args) if args else fn()
        except TypeError:
            fn()
    else:
        if cmd_name:
            print(c(C.RED, "Unknown command: {}. Type 'help' for options.".format(cmd_name)))

# --- MAIN / REPL ---
def main():
    args = sys.argv[1:]
    
    # Check NO_COLOR early if passed as argument
    if "--no-color" in args:
        global USE_COLOR
        USE_COLOR = False
        args.remove("--no-color")
        
    if len(args) > 0:
        # CLI Mode
        cmd = args[0]
        dispatch(cmd, args[1:])
    else:
        # REPL Mode
        print(c(C.BOLD + C.RED, r"""
  ___ _   _____              _           _ 
 | __/ | |_   _|___ _ _ _ __(_)_ _  __ _| |
 | _|| |   | |/ -_) '_| '  \| | ' \/ _` | |
 |_| |_|   |_|\___|_| |_|_|_|_|_||_\__,_|_|
                                           
        """))
        print(c(C.DIM, "Welcome to the F1 Terminal! Type 'help' to see commands."))
        
        while True:
            try:
                raw_in = input("\n{} ".format(c(C.RED, "f1>"))).strip()
                if not raw_in:
                    continue
                user_input = raw_in.split()
                dispatch(user_input[0], user_input[1:])
            except (KeyboardInterrupt, EOFError):
                print("\nGoodbye!")
                break

if __name__ == "__main__":
    main()
