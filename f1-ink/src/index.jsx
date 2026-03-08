import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, Newline, Spacer } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import fetch from 'node-fetch';

// --- CONFIGURATION ---
const BASE = "https://api.jolpi.ca/ergast/f1";
const SEASON = "2026";

// --- THEME & UTILS ---
const TEAM_COLORS = {
    'Red Bull': 'blueBright',
    'Ferrari': 'redBright',
    'Mercedes': 'cyanBright',
    'McLaren': 'yellow',
    'Aston Martin': 'green',
    'Alpine': 'magentaBright',
    'Williams': 'blue',
    'AlphaTauri': 'white',
    'RB': 'white',
    'Sauber': 'greenBright',
    'Haas': 'gray'
};

function teamColor(name) {
    for (const [k, v] of Object.entries(TEAM_COLORS)) {
        if (name.toLowerCase().includes(k.toLowerCase())) return v;
    }
    return 'greenBright';
}

const NAT_FLAGS = {
    'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Spanish': '🇪🇸',
    'Australian': '🇦🇺', 'Mexican': '🇲🇽', 'French': '🇫🇷', 'Japanese': '🇯🇵',
    'Canadian': '🇨🇦', 'German': '🇩🇪', 'Thai': '🇹🇭', 'Danish': '🇩🇰',
    'Finnish': '🇫🇮', 'Chinese': '🇨🇳', 'American': '🇺🇸', 'New Zealander': '🇳🇿',
    'Italian': '🇮🇹', 'Austrian': '🇦🇹', 'Swiss': '🇨🇭'
};

const RACE_FLAGS = {
    'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
    'China': '🇨🇳', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Italy': '🇮🇹',
    'Monaco': '🇲🇨', 'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹',
    'UK': '🇬🇧', 'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱',
    'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
    'Qatar': '🇶🇦', 'UAE': '🇦🇪'
};

function getFlag(nat, map) { return map[nat] || '🏁'; }

function pad(str, len, right = false) {
    const s = String(str ?? '');
    if (right) return s.padStart(len).slice(0, len);
    return s.padEnd(len).slice(0, len);
}

// --- SHARED COMPONENTS ---
const Header = ({ title }) => (
    <Box flexDirection="column" marginBottom={1}>
        <Text color="yellowBright" bold>{'═'.repeat(65)}</Text>
        <Text color="whiteBright" bold>  🏎️  {title.toUpperCase()}</Text>
        <Text color="yellowBright" bold>{'═'.repeat(65)}</Text>
    </Box>
);

const Divider = ({ width = 65 }) => (
    <Text color="gray">{'─'.repeat(width)}</Text>
);

const Loading = ({ label }) => (
    <Box marginY={1}>
        <Text color="cyan"><Spinner type="dots" /> {label}...</Text>
    </Box>
);

const Medal = ({ pos }) => {
    if (pos === '1' || pos === 1) return <Text color="yellowBright">🥇</Text>;
    if (pos === '2' || pos === 2) return <Text color="whiteBright">🥈</Text>;
    if (pos === '3' || pos === 3) return <Text color="redBright">🥉</Text>;
    return <Text>  </Text>;
};

const Err = ({ msg }) => (
    <Box marginY={1} paddingX={2} borderStyle="single" borderColor="red">
        <Text color="redBright" bold>ERROR: </Text>
        <Text color="red">{msg}</Text>
    </Box>
);

// --- API LAYER ---
const apiFetch = async (endpoint) => {
    try {
        const res = await fetch(`${BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        return await res.json();
    } catch (err) {
        throw new Error(err.message.includes('fetch') ? `Network error: Cannot reach Ergast API.` : err.message);
    }
};

// --- VIEWS ---
const StandingsView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiFetch(`/${SEASON}/driverStandings.json`)
            .then(d => setData(d.MRData.StandingsTable.StandingsLists[0]?.DriverStandings))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching driver standings" />;

    return (
        <Box flexDirection="column">
            <Header title={`Driver Standings ${SEASON}`} />
            <Box marginBottom={1}>
                <Text dimColor>
                    {pad('POS', 4)} {pad('DRIVER', 22)} {pad('TEAM', 25)} {'PTS'}
                </Text>
            </Box>
            {data.map(d => {
                const team = d.Constructors[0]?.name || 'Unknown';
                const name = `${d.Driver.givenName[0]} ${d.Driver.familyName}`;
                const pos = d.position || d.positionText || '-';
                const pts = d.points || '0';
                return (
                    <Box key={d.Driver.driverId}>
                        <Box width={4}><Text bold>{pad(pos, 2, true)} </Text></Box>
                        <Box width={3}><Medal pos={pos} /></Box>
                        <Box width={22}><Text color="white">{name}</Text></Box>
                        <Box width={25}><Text color={teamColor(team)}>{team}</Text></Box>
                        <Text color="greenBright" bold>{pad(pts, 4, true)}</Text>
                    </Box>
                );
            })}
        </Box>
    );
};

const ConstructorsView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiFetch(`/${SEASON}/constructorStandings.json`)
            .then(d => setData(d.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching constructor standings" />;

    return (
        <Box flexDirection="column">
            <Header title={`Constructor Standings ${SEASON}`} />
            <Box marginBottom={1}>
                <Text dimColor>
                    {pad('POS', 4)} {pad('TEAM', 25)} {pad('NAT', 6)} {pad('WINS', 6)} {'PTS'}
                </Text>
            </Box>
            {data.map(d => {
                const team = d.Constructor.name;
                const flag = getFlag(d.Constructor.nationality, NAT_FLAGS);
                const pos = d.position || d.positionText || '-';
                const pts = d.points || '0';
                const wins = d.wins || '0';
                return (
                    <Box key={d.Constructor.constructorId}>
                        <Box width={4}><Text bold>{pad(pos, 2, true)} </Text></Box>
                        <Box width={3}><Medal pos={pos} /></Box>
                        <Box width={25}><Text color={teamColor(team)}>{team}</Text></Box>
                        <Box width={6}><Text>{flag}</Text></Box>
                        <Box width={6}><Text>{pad(wins, 4, true)}</Text></Box>
                        <Text color="greenBright" bold>{pad(pts, 4, true)}</Text>
                    </Box>
                );
            })}
        </Box>
    );
};

const ScheduleView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiFetch(`/${SEASON}.json`)
            .then(d => setData(d.MRData.RaceTable.Races))
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching schedule" />;

    return (
        <Box flexDirection="column">
            <Header title={`Race Schedule ${SEASON}`} />
            {data.map(r => {
                const flag = getFlag(r.Circuit.Location.country, RACE_FLAGS);
                let dateStr = r.date;
                let timeStr = r.time ? r.time.replace('Z', '') : 'TBD';

                if (r.time) {
                    const rDt = new Date(`${r.date}T${r.time}`);
                    const gmt3 = new Date(rDt.getTime() + 3 * 3600 * 1000);
                    dateStr = gmt3.toISOString().split('T')[0];
                    timeStr = gmt3.toISOString().split('T')[1].substring(0, 5);
                }

                return (
                    <Box flexDirection="column" key={r.round} marginBottom={1}>
                        <Box>
                            <Text dimColor>{pad(r.round, 2, true)}.</Text>
                            <Text> {flag} </Text>
                            <Text color="whiteBright" bold>{pad(r.raceName, 30)}</Text>
                            <Text color="cyan">{pad(dateStr, 12)}</Text>
                            <Text dimColor>{timeStr}</Text>
                        </Box>
                        <Box paddingLeft={7}>
                            <Text dimColor>{r.Circuit.circuitName}, {r.Circuit.Location.locality}</Text>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};

const LastRaceView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const fetchLastRace = async () => {
            try {
                let res = await apiFetch(`/current/last/results.json`);
                if (res.MRData.RaceTable.Races.length === 0) {
                    const currentSeason = parseInt(res.MRData.RaceTable.season, 10);
                    const prevSeason = currentSeason - 1;
                    res = await apiFetch(`/${prevSeason}/last/results.json`);
                }
                setData(res.MRData.RaceTable.Races[0]);
            } catch (e) {
                setErr(e.message);
            }
        };
        fetchLastRace();
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching last race" />;

    return (
        <Box flexDirection="column">
            <Header title="Last Race Results" />
            <Box marginBottom={1}>
                <Text color="cyanBright">Season {data.season} Round {data.round}: {data.raceName}</Text>
            </Box>
            <Box marginBottom={1}>
                <Text dimColor>
                    {pad('POS', 4)} {pad('DRIVER', 22)} {pad('TEAM', 25)} {'TIME/STATUS'}
                </Text>
            </Box>
            {data.Results.map(r => {
                const team = r.Constructor.name;
                const name = `${r.Driver.givenName[0]} ${r.Driver.familyName}`;
                const timeStr = r.Time ? r.Time.time : r.status;
                const isFinished = !timeStr.includes('Laps') && timeStr !== 'Finished';

                return (
                    <Box key={r.position}>
                        <Box width={4}><Text bold>{pad(r.position, 3, true)}</Text></Box>
                        <Box width={22}><Text color="white">{name}</Text></Box>
                        <Box width={25}><Text color={teamColor(team)}>{team}</Text></Box>
                        <Text color={isFinished ? 'greenBright' : 'gray'}>{timeStr}</Text>
                    </Box>
                );
            })}
        </Box>
    );
};

const NextRaceView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiFetch(`/current.json`)
            .then(d => {
                const races = d.MRData.RaceTable.Races;
                const now = new Date();
                let nextRace = null;
                for (const r of races) {
                    const dateStr = r.date;
                    const timeStr = r.time || "00:00:00Z";
                    const rDt = new Date(`${dateStr}T${timeStr}`);
                    if (rDt > now) {
                        nextRace = { ...r, rDt };
                        break;
                    }
                }
                setData(nextRace || { noRaces: true });
            })
            .catch(e => setErr(e.message));
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching next race" />;

    if (data.noRaces) {
        return (
            <Box flexDirection="column">
                <Header title="Next Race" />
                <Text>No upcoming races found for this season.</Text>
            </Box>
        );
    }

    const diff = data.rDt - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    const flag = getFlag(data.Circuit.Location.country, RACE_FLAGS);

    const gmt3 = new Date(data.rDt.getTime() + 3 * 3600 * 1000);
    const dateStr = gmt3.toISOString().split('T')[0];
    const timeStr = gmt3.toISOString().split('T')[1].substring(0, 5);

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title="Next Race" />
            <Box flexDirection="column" marginY={1}>
                <Box>
                    <Text>{flag} </Text>
                    <Text color="whiteBright" bold>{data.raceName}</Text>
                </Box>
                <Box paddingLeft={4}>
                    <Text dimColor>Location: {data.Circuit.circuitName}, {data.Circuit.Location.locality}</Text>
                </Box>
                <Box paddingLeft={4}>
                    <Text color="cyan">Date:     {dateStr} at {timeStr}</Text>
                </Box>
                <Box paddingLeft={4} marginTop={1}>
                    <Text color="yellowBright" bold>Starts in: {days}d {hours}h {minutes}m</Text>
                </Box>
            </Box>
        </Box>
    );
};

const FALLBACK_TEAMS = {
    "albon": "Williams", "alonso": "Aston Martin", "antonelli": "Mercedes",
    "bearman": "Haas", "bortoleto": "Sauber", "bottas": "Sauber",
    "colapinto": "Williams", "gasly": "Alpine", "hadjar": "RB",
    "hamilton": "Ferrari", "hulkenberg": "Sauber", "lawson": "RB",
    "leclerc": "Ferrari", "lindblad": "RB", "norris": "McLaren", "ocon": "Haas",
    "piastri": "McLaren", "perez": "Red Bull", "russell": "Mercedes",
    "sainz": "Williams", "stroll": "Aston Martin", "max_verstappen": "Red Bull",
    "tsunoda": "RB", "doohan": "Alpine"
};

const DriversView = () => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const [dRes, sRes] = await Promise.all([
                    apiFetch(`/${SEASON}/drivers.json`),
                    apiFetch(`/${SEASON}/driverStandings.json`).catch(() => null)
                ]);

                const tMap = {};
                if (sRes?.MRData?.StandingsTable?.StandingsLists?.length > 0) {
                    sRes.MRData.StandingsTable.StandingsLists[0].DriverStandings.forEach(d => {
                        tMap[d.Driver.driverId] = d.Constructors[0]?.name || 'Unknown';
                    });
                }

                const drivers = dRes.MRData.DriverTable.Drivers.map(d => ({
                    ...d,
                    team: tMap[d.driverId] || FALLBACK_TEAMS[d.driverId] || 'Unknown'
                }));
                setData(drivers);
            } catch (e) {
                setErr(e.message);
            }
        };
        fetchDrivers();
    }, []);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label="Fetching drivers" />;

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title={`Drivers ${SEASON}`} />
            <Box marginBottom={1}>
                <Text dimColor>
                    {pad('NO', 4)} {pad('DRIVER', 23)} {pad('TEAM', 20)} {pad('NAT', 6)} {'CODE'}
                </Text>
            </Box>
            {data.map(d => {
                const name = `${d.givenName} ${d.familyName}`;
                const flag = getFlag(d.nationality, NAT_FLAGS);
                return (
                    <Box key={d.driverId}>
                        <Text>
                            <Text bold>{pad(d.permanentNumber || '-', 3, true)} </Text>
                            <Text color="white">{pad(name, 23)}</Text>
                            <Text color={teamColor(d.team)}>{pad(d.team, 20)}</Text>
                            <Text>{pad(flag, 6)}</Text>
                            <Text color="cyan">{d.code || 'N/A'}</Text>
                        </Text>
                    </Box>
                );
            })}
        </Box>
    );
};

const PilotView = ({ pilotCode }) => {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        if (!pilotCode) {
            setErr("Please provide a pilot 3-letter code. (e.g., 'npm start pilot VER')");
            return;
        }

        const code = pilotCode.toUpperCase();

        const fetchStats = async () => {
            try {
                // 1. Fetch current drivers to resolve ID
                const activeRes = await apiFetch('/current/drivers.json');
                let driver = activeRes.MRData.DriverTable.Drivers.find(d => d.code === code);
                let driverId = '';

                if (!driver) {
                    // Fallback to checking id
                    driverId = pilotCode.toLowerCase();
                    try {
                        const singleRes = await apiFetch(`/drivers/${driverId}.json`);
                        if (singleRes.MRData.total === "0") {
                            setErr(`Driver '${code}' not found in active grid. Use full driverId for historical pilots.`);
                            return;
                        }
                        driver = singleRes.MRData.DriverTable.Drivers[0];
                    } catch (e) {
                        setErr(`Driver '${code}' not found.`);
                        return;
                    }
                } else {
                    driverId = driver.driverId;
                }

                // 2. Fetch parallel stats
                const [winsRes, polesRes, startsRes] = await Promise.all([
                    apiFetch(`/drivers/${driverId}/results/1.json?limit=1`),
                    apiFetch(`/drivers/${driverId}/qualifying/1.json?limit=1`),
                    apiFetch(`/drivers/${driverId}/results.json?limit=1`)
                ]);

                const wdcMap = {
                    "michael_schumacher": 7, "hamilton": 7, "fangio": 5, "prost": 4,
                    "vettel": 4, "max_verstappen": 4, "brabham": 3, "stewart": 3,
                    "lauda": 3, "piquet": 3, "senna": 3, "alonso": 2, "hakkinen": 2,
                    "fittipaldi": 2, "clark": 2, "ascari": 2, "raikkonen": 1, "rosberg": 1,
                    "nico_rosberg": 1, "button": 1, "villeneuve": 1, "damon_hill": 1,
                    "mansell": 1, "andretti": 1, "hunt": 1, "scheckter": 1, "jones": 1,
                    "surtees": 1, "phil_hill": 1, "hawthorn": 1, "farina": 1
                };

                setData({
                    driver,
                    wins: winsRes.MRData.total,
                    poles: polesRes.MRData.total,
                    starts: startsRes.MRData.total,
                    champs: wdcMap[driverId] || 0
                });
            } catch (error) {
                setErr(error.message);
            }
        };

        fetchStats();
    }, [pilotCode]);

    if (err) return <Err msg={err} />;
    if (!data) return <Loading label={`Searching Driver Info`} />;

    const { driver, wins, poles, starts, champs } = data;
    const flag = getFlag(driver.nationality, NAT_FLAGS);
    const name = `${driver.givenName} ${driver.familyName}`;
    const number = driver.permanentNumber || 'N/A';

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title={`Pilot Profile: ${pilotCode.toUpperCase()}`} />
            <Box flexDirection="column" marginY={1}>
                <Box>
                    <Text>{flag} </Text>
                    <Text color="whiteBright" bold>{name}</Text>
                    <Text>  |  #{number}  |  {driver.dateOfBirth}</Text>
                </Box>
                <Box marginTop={1} paddingLeft={4} flexDirection="column">
                    <Text><Text color="yellowBright">World Championships: </Text><Text bold>{champs}</Text></Text>
                    <Text><Text color="greenBright">All-Time Wins:       </Text><Text bold>{wins}</Text></Text>
                    <Text><Text color="cyanBright">Pole Positions:      </Text><Text bold>{poles}</Text></Text>
                    <Text><Text dimColor>Race Starts:         </Text><Text bold>{starts}</Text></Text>
                </Box>
            </Box>
        </Box>
    );
};

// --- INTERACTIVE MENU ---
const VIEWS = {
    standings: <StandingsView />,
    drivers: <DriversView />,
    constructors: <ConstructorsView />,
    schedule: <ScheduleView />,
    next: <NextRaceView />,
    last: <LastRaceView />
};

const MENU_ITEMS = [
    { key: '1', name: 'Driver Standings', view: 'standings' },
    { key: '2', name: 'Drivers / Pilots List', view: 'drivers' },
    { key: '3', name: 'Constructor Standings', view: 'constructors' },
    { key: '4', name: 'Race Schedule', view: 'schedule' },
    { key: '5', name: 'Next Race', view: 'next' },
    { key: '6', name: 'Last Race Results', view: 'last' },
    { key: 'q', name: 'Quit', view: 'quit' }
];

const App = ({ initialView, pilotCode }) => {
    const [currentView, setCurrentView] = useState(initialView || 'menu');

    useInput((input, key) => {
        if (currentView !== 'menu') {
            if (input.toLowerCase() === 'b' || key.escape || input.toLowerCase() === 'm') {
                setCurrentView('menu');
            } else if (input.toLowerCase() === 'q') {
                process.exit(0);
            }
            return;
        }

        const item = MENU_ITEMS.find(m => m.key === input.toLowerCase());
        if (item) {
            if (item.view === 'quit') process.exit(0);
            else setCurrentView(item.view);
        }
    });

    if (currentView !== 'menu' && VIEWS[currentView]) {
        return (
            <Box flexDirection="column" padding={1}>
                {VIEWS[currentView]}
                <Box marginTop={1}>
                    <Text dimColor>Press </Text>
                    <Text color="yellowBright" bold>[M]</Text>
                    <Text dimColor> or </Text>
                    <Text color="yellowBright" bold>[B]</Text>
                    <Text dimColor> to return to menu, </Text>
                    <Text color="redBright" bold>[Q]</Text>
                    <Text dimColor> to quit.</Text>
                </Box>
            </Box>
        );
    }

    // Explicit dynamic view matching for pilot
    if (currentView === 'pilot') {
        return (
            <Box flexDirection="column" padding={1}>
                <PilotView pilotCode={pilotCode} />
                <Box marginTop={1}>
                    <Text dimColor>Press </Text>
                    <Text color="yellowBright" bold>[M]</Text>
                    <Text dimColor> or </Text>
                    <Text color="yellowBright" bold>[B]</Text>
                    <Text dimColor> to return to menu, </Text>
                    <Text color="redBright" bold>[Q]</Text>
                    <Text dimColor> to quit.</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" padding={2} borderStyle="round" borderColor="redBright">
            <Box justifyContent="center" marginBottom={1}>
                <Text color="redBright" bold>
                    F1 TERMINAL DASHBOARD
                </Text>
            </Box>
            <Box justifyContent="center" marginBottom={1}>
                <Text color="whiteBright" italic>Interactive Terminal Dashboard</Text>
            </Box>

            <Box flexDirection="column" marginX={4} marginTop={1}>
                <Text dimColor marginBottom={1}>Select an option:</Text>
                {MENU_ITEMS.map(m => (
                    <Box key={m.key}>
                        <Text color="yellowBright" bold>[{m.key}]</Text>
                        <Text>  {m.name}</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// --- CLI ENTRY POINT ---
const args = process.argv.slice(2);
let initView = 'menu';
if (!args[0]) {
    render(<App />);
} else {
    const cmd = args[0].toLowerCase();
    if (['standings', 'drivers', 'constructors', 'schedule', 'next', 'last', 'pilot'].includes(cmd)) {
        render(<App initialView={cmd} pilotCode={args[1]} />);
    } else {
        console.log(chalk.red.bold('\nF1 Terminal CLI - Error'));
        console.log(`Unknown command: ${cmd}\n`);
        console.log(chalk.bold('Available commands:'));
        console.log(`  ${chalk.green('standings')}    - Show driver standings`);
        console.log(`  ${chalk.green('drivers')}      - Show all drivers/pilots grid`);
        console.log(`  ${chalk.green('constructors')} - Show constructor standings`);
        console.log(`  ${chalk.green('schedule')}     - Show race schedule`);
        console.log(`  ${chalk.green('next')}         - Show next upcoming race and countdown`);
        console.log(`  ${chalk.green('last')}         - Show last race results`);
        console.log(`  ${chalk.green('pilot VER')}    - Show historical stats for a pilot`);
        console.log(`\nRun without arguments for interactive menu.`);
        process.exit(0);
    }
}
