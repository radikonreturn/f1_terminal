import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput, Newline, Spacer } from 'ink';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import fetch from 'node-fetch';

// --- CONFIGURATION ---
const BASE = "https://api.jolpi.ca/ergast/f1";
const SEASON = "2026";

// --- THEME & UTILS ---
const TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',
    'Red Bull': '#3671C6',
    'Ferrari': '#E8002D',
    'Mercedes': '#27F4D2',
    'McLaren': '#FF8000',
    'Aston Martin': '#358C75',
    'Alpine F1 Team': '#FF87BC',
    'Alpine': '#FF87BC',
    'Williams': '#64C4FF',
    'RB F1 Team': '#6692FF',
    'RB': '#6692FF',
    'Haas F1 Team': '#B6BABD',
    'Haas': '#B6BABD',
    'Sauber/Kick': '#52E252',
    'Sauber': '#52E252',
    'Audi': '#52E252' // Using Sauber's color temporarily until Audi rebranding is official
};

function teamColor(name) {
    for (const [k, v] of Object.entries(TEAM_COLORS)) {
        if (name.toLowerCase().includes(k.toLowerCase())) return chalk.hex(v);
    }
    return chalk.gray;
}

const NAT_FLAGS = {
    'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Spanish': '🇪🇸',
    'Australian': '🇦🇺', 'Mexican': '🇲🇽', 'French': '🇫🇷', 'Japanese': '🇯🇵',
    'Canadian': '🇨🇦', 'German': '🇩🇪', 'Thai': '🇹🇭', 'Danish': '🇩🇰',
    'Finnish': '🇫🇮', 'Chinese': '🇨🇳', 'American': '🇺🇸', 'New Zealander': '🇳🇿',
    'Italian': '🇮🇹', 'Austrian': '🇦🇹', 'Swiss': '🇨🇭', 'Argentine': '🇦🇷',
    'Brazilian': '🇧🇷'
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

// --- ASCII ART HEADER ---
const AsciiHeader = () => {
    const lines = [
        "  ___ _   _____              _           _ ",
        " | __/ | |_   _|___ _ _ _ __(_)_ _  __ _| |",
        " | _|| |   | |/ -_) '_| '  \\| | ' \\/ _` | |",
        " |_| |_|   |_|\\___|_| |_|_|_|_|_||_\\__,_|_|"
    ];
    return (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
            {lines.map((line, i) => (
                <Text key={i} color="redBright" bold wrap="none">{line}</Text>
            ))}
        </Box>
    );
};

// --- CACHE & API LAYER ---
const cache = new Map();
const CACHE_TTL = { LONG: 5 * 60 * 1000, SHORT: 30 * 1000 };

const apiFetch = async (endpoint, ttl = CACHE_TTL.LONG) => {
    const url = `${BASE}${endpoint}`;
    if (cache.has(url)) {
        const cached = cache.get(url);
        if (Date.now() - cached.timestamp < ttl) {
            return { data: cached.data, cached: true };
        }
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        cache.set(url, { data, timestamp: Date.now() });
        return { data, cached: false };
    } catch (err) {
        if (cache.has(url)) {
            return { data: cache.get(url).data, cached: true, offline: true };
        }
        throw new Error(err.message.includes('fetch') ? `Network Error: Cannot reach API.` : err.message);
    }
};

// --- SHARED UI COMPONENTS ---
const Header = ({ title, isCached, isOffline }) => (
    <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold>🏎️  {title.toUpperCase()}</Text>
        <Box>
            {isOffline && <Text color="redBright"> ⚠️ OFFLINE </Text>}
            {isCached && !isOffline && <Text color="gray"> 📦 CACHED </Text>}
        </Box>
    </Box>
);

const Err = ({ msg }) => (
    <Box marginY={1} padding={1} borderStyle="single" borderColor="red">
        <Text color="redBright" bold>ERROR: </Text>
        <Text color="red">{msg} </Text>
        <Text dimColor>(Press [R] to retry)</Text>
    </Box>
);

const Medal = ({ pos }) => {
    if (pos === '1' || pos === 1) return <Text color="#FFD700">🥇</Text>;
    if (pos === '2' || pos === 2) return <Text color="#C0C0C0">🥈</Text>;
    if (pos === '3' || pos === 3) return <Text color="#CD7F32">🥉</Text>;
    return <Text>  </Text>;
};

// --- CUSTOM HOOK ---
const useF1Data = (endpoint, ttl = CACHE_TTL.LONG, dependencies = []) => {
    const [state, setState] = useState({ data: null, err: null, loading: true, cached: false, offline: false });
    const [tick, setTick] = useState(0); // Trigger refresh

    useEffect(() => {
        let isMounted = true;
        setState(s => ({ ...s, loading: true, err: null }));

        apiFetch(endpoint, ttl)
            .then(res => {
                if (isMounted) setState({ data: res.data, err: null, loading: false, cached: res.cached, offline: res.offline });
            })
            .catch(err => {
                if (isMounted) setState({ data: null, err: err.message, loading: false, cached: false, offline: false });
            });

        return () => { isMounted = false; };
    }, [endpoint, tick, ...dependencies]);

    const refresh = () => setTick(t => t + 1);
    return { ...state, refresh };
};

// --- VIEWS ---
const TableRow = ({ cols, widthArr, dim = false }) => (
    <Box>
        {cols.map((col, i) => (
            <Box key={i} width={widthArr[i]}>
                {typeof col === 'string' || typeof col === 'number' ? <Text dimColor={dim}>{col}</Text> : col}
            </Box>
        ))}
    </Box>
);

const StandingsView = () => {
    const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}/driverStandings.json`, CACHE_TTL.LONG);

    useInput((input) => {
        if (input.toLowerCase() === 'r') refresh();
    });

    if (loading) return <Box><Spinner type="dots" /><Text color="cyan"> Fetching standings...</Text></Box>;
    if (err) return <Err msg={err} />;

    const tableData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
    const widths = [6, 4, 25, 25, 6];

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title={`Driver Standings ${SEASON}`} isCached={cached} isOffline={offline} />
            <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
                <TableRow cols={['POS', '', 'DRIVER', 'TEAM', 'PTS']} widthArr={widths} dim />
                {tableData.map((d, i) => {
                    const team = d.Constructors[0]?.name || 'Unknown';
                    const name = `${d.Driver.givenName[0]} ${d.Driver.familyName}`;
                    const pos = d.position || d.positionText || '-';
                    const pts = d.points || '0';
                    const isMedal = ['1', '2', '3'].includes(pos);
                    const isDim = i > 9 && !isMedal; // Top 10 bright

                    return (
                        <TableRow
                            key={d.Driver.driverId}
                            widths={widths}
                            dim={isDim}
                            cols={[
                                <Text bold={isMedal}>{pad(pos, 3, true)}</Text>,
                                <Medal pos={pos} />,
                                <Text color={isMedal ? "whiteBright" : "white"} dimColor={isDim}>{name}</Text>,
                                <Text>{teamColor(team)(team)}</Text>,
                                <Text color="greenBright" bold>{pad(pts, 4, true)}</Text>
                            ]}
                            widthArr={widths}
                        />
                    );
                })}
            </Box>
        </Box>
    );
};

const ConstructorsView = () => {
    const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}/constructorStandings.json`, CACHE_TTL.LONG);

    useInput((input) => { if (input.toLowerCase() === 'r') refresh(); });

    if (loading) return <Box><Spinner type="dots" /><Text color="cyan"> Fetching constructors...</Text></Box>;
    if (err) return <Err msg={err} />;

    const tableData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
    const widths = [6, 4, 25, 6, 6, 6];

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title={`Constructor Standings ${SEASON}`} isCached={cached} isOffline={offline} />
            <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
                <TableRow cols={['POS', '', 'TEAM', 'NAT', 'WINS', 'PTS']} widthArr={widths} dim />
                {tableData.map((d, i) => {
                    const team = d.Constructor.name;
                    const flag = getFlag(d.Constructor.nationality, NAT_FLAGS);
                    const pos = d.position || d.positionText || '-';
                    const pts = d.points || '0';
                    const wins = d.wins || '0';
                    const isDim = i > 4;

                    return (
                        <TableRow
                            key={d.Constructor.constructorId}
                            widthArr={widths}
                            cols={[
                                <Text bold>{pad(pos, 3, true)}</Text>,
                                <Medal pos={pos} />,
                                <Text>{teamColor(team)(team)}</Text>,
                                <Text>{flag}</Text>,
                                <Text dimColor={isDim}>{pad(wins, 4, true)}</Text>,
                                <Text color="greenBright" bold>{pad(pts, 4, true)}</Text>
                            ]}
                        />
                    );
                })}
            </Box>
        </Box>
    );
};

const ScheduleView = () => {
    const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}.json`, CACHE_TTL.LONG);

    useInput((input) => { if (input.toLowerCase() === 'r') refresh(); });

    if (loading) return <Box><Spinner type="dots" /><Text color="cyan"> Fetching schedule...</Text></Box>;
    if (err) return <Err msg={err} />;

    const races = data?.MRData?.RaceTable?.Races || [];
    const widths = [6, 4, 32, 12, 16];

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title={`Race Schedule ${SEASON}`} isCached={cached} isOffline={offline} />
            <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
                <TableRow cols={['RND', '', 'GRAND PRIX', 'DATE', 'TIME (UTC+3)']} widthArr={widths} dim />
                {races.map(r => {
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
                        <TableRow
                            key={r.round}
                            widthArr={widths}
                            cols={[
                                <Text dimColor>{pad(r.round, 3, true)}</Text>,
                                <Text>{flag}</Text>,
                                <Text color="whiteBright">{r.raceName}</Text>,
                                <Text color="cyan">{dateStr}</Text>,
                                <Text dimColor>{timeStr}</Text>
                            ]}
                        />
                    );
                })}
            </Box>
        </Box>
    );
};

const NextRaceView = () => {
    const { data, err, loading, cached, offline, refresh } = useF1Data(`/current.json`, CACHE_TTL.SHORT);
    const [timeLeft, setTimeLeft] = useState('');

    useInput((input) => { if (input.toLowerCase() === 'r') refresh(); });

    useEffect(() => {
        if (!data) return;
        const races = data.MRData.RaceTable.Races;
        const now = new Date();
        let next = null;
        for (const r of races) {
            const dateStr = r.date;
            const timeStr = r.time || "00:00:00Z";
            const rDt = new Date(`${dateStr}T${timeStr}`);
            if (rDt > now) {
                next = { ...r, rDt };
                break;
            }
        }

        if (!next) {
            setTimeLeft('End of season');
            return;
        }

        const iv = setInterval(() => {
            const diff = next.rDt - new Date();
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${d}d ${h}h ${m}m ${pad(s, 2, true)}s`);
        }, 1000);

        return () => clearInterval(iv);
    }, [data]);

    if (loading) return <Box><Spinner type="dots" /><Text color="cyan"> Fetching next race...</Text></Box>;
    if (err) return <Err msg={err} />;

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title="Next Race Countdown" isCached={cached} isOffline={offline} />
            <Box borderStyle="round" borderColor="greenBright" flexDirection="column" paddingX={2} paddingY={1}>
                <Text>Upcoming race details are live calculating...</Text>
                <Text color="yellowBright" bold marginTop={1}>STARTS IN: {timeLeft}</Text>
                <Text dimColor marginTop={1}>(Press [R] to update schedule payload)</Text>
            </Box>
        </Box>
    );
};

const PilotSearchView = () => {
    const [query, setQuery] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useInput((input, key) => {
        if (key.return && query.length > 0) {
            setSubmitted(true);
        } else if (!submitted) {
            // Only allow characters
            if (/^[a-zA-Z]$/.test(input) && query.length < 5) {
                setQuery(prev => (prev + input).toUpperCase());
            } else if (key.backspace || key.delete) {
                setQuery(prev => prev.slice(0, -1));
            }
        } else if (input.toLowerCase() === 'r') {
            setSubmitted(false);
            setQuery('');
        }
    });

    return (
        <Box flexDirection="column" paddingX={1}>
            <Header title="Pilot Search" isCached={false} isOffline={false} />

            {!submitted ? (
                <Box borderStyle="single" borderColor="blueBright" padding={1}>
                    <Text>Enter 3-Letter Driver Code (e.g., VER, HAM, LEC): </Text>
                    <Text color="cyanBright" bold>{query}</Text>
                    <Text><Spinner type="dots" /></Text>
                </Box>
            ) : (
                <PilotResults code={query} />
            )}
        </Box>
    );
};

const PilotResults = ({ code }) => {
    const { data: activeData, err: err1, loading: l1 } = useF1Data('/current/drivers.json');
    const [stats, setStats] = useState({ loading: true, data: null, err: null });

    useEffect(() => {
        if (!activeData && !err1) return;

        const fetchStats = async () => {
            try {
                let driver = null, driverId = '';

                if (activeData?.MRData?.DriverTable?.Drivers) {
                    driver = activeData.MRData.DriverTable.Drivers.find(d => d.code === code);
                }

                if (!driver) {
                    driverId = code.toLowerCase();
                    const res = await apiFetch(`/drivers/${driverId}.json`);
                    if (res.data.MRData.total === "0") throw new Error(`Not found: ${code}`);
                    driver = res.data.MRData.DriverTable.Drivers[0];
                } else {
                    driverId = driver.driverId;
                }

                // Parallel fetch
                const [wRes, pRes, sRes] = await Promise.all([
                    apiFetch(`/drivers/${driverId}/results/1.json?limit=1`),
                    apiFetch(`/drivers/${driverId}/qualifying/1.json?limit=1`),
                    apiFetch(`/drivers/${driverId}/results.json?limit=1`)
                ]);

                setStats({
                    loading: false,
                    err: null,
                    data: {
                        driver,
                        wins: wRes.data.MRData.total,
                        poles: pRes.data.MRData.total,
                        starts: sRes.data.MRData.total
                    }
                });
            } catch (e) {
                setStats({ loading: false, err: e.message, data: null });
            }
        }

        fetchStats();
    }, [activeData, err1, code]);

    if (l1 || stats.loading) return <Box><Spinner type="dots" /><Text color="cyan"> Fetching stats for {code}...</Text></Box>;
    if (err1 || stats.err) return <Err msg={err1 || stats.err} />;

    const { driver, wins, poles, starts } = stats.data;
    const flag = getFlag(driver.nationality, NAT_FLAGS);

    return (
        <Box borderStyle="round" borderColor="cyanBright" flexDirection="column" paddingX={2} paddingY={1}>
            <Box marginBottom={1}>
                <Text>{flag} </Text>
                <Text color="whiteBright" bold>{driver.givenName} {driver.familyName}</Text>
                <Text dimColor>  |  #{driver.permanentNumber || 'N/A'}  |  {driver.dateOfBirth}</Text>
            </Box>
            <Box flexDirection="column" paddingLeft={4}>
                <Text><Text color="greenBright">All-Time Wins:       </Text><Text bold>{wins}</Text></Text>
                <Text><Text color="cyanBright">Pole Positions:      </Text><Text bold>{poles}</Text></Text>
                <Text><Text dimColor>Race Starts:         </Text><Text bold>{starts}</Text></Text>
            </Box>
            <Text dimColor marginTop={1}>(Press [R] to search another pilot, or [M] for Menu)</Text>
        </Box>
    );
};


// --- MAIN APP ---
const items = [
    { label: 'Driver Standings', value: 'standings' },
    { label: 'Constructor Standings', value: 'constructors' },
    { label: 'Race Schedule', value: 'schedule' },
    { label: 'Next Race Countdown', value: 'next' },
    { label: 'Pilot Search', value: 'pilot' },
    { label: 'Quit', value: 'quit' }
];

const App = ({ initialView }) => {
    const [view, setView] = useState(initialView || 'menu');

    useInput((input, key) => {
        if (input.toLowerCase() === 'm' || input.toLowerCase() === 'b' || key.escape) {
            setView('menu');
        } else if (input.toLowerCase() === 'q') {
            process.exit(0);
        }
    });

    const handleSelect = (item) => {
        if (item.value === 'quit') process.exit(0);
        setView(item.value);
    };

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="red" padding={1}>
            <AsciiHeader />

            <Box flexDirection="row">
                {/* SIDEBAR */}
                <Box width={30} borderStyle="single" borderColor="gray" flexDirection="column" paddingRight={1}>
                    <Text bold marginBottom={1} color="magentaBright">🏁 NAVIGATION</Text>
                    {view === 'menu' ? (
                        <SelectInput items={items} onSelect={handleSelect} />
                    ) : (
                        <Box flexDirection="column">
                            {items.map(i => (
                                <Text key={i.value} color={i.value === view ? "greenBright" : "gray"}>
                                    {i.value === view ? '▶ ' : '  '}{i.label}
                                </Text>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* CONTENT */}
                <Box flexDirection="column" flexGrow={1} paddingLeft={2}>
                    {view === 'menu' && <Text dimColor>Select an option from the left to begin.</Text>}
                    {view === 'standings' && <StandingsView />}
                    {view === 'constructors' && <ConstructorsView />}
                    {view === 'schedule' && <ScheduleView />}
                    {view === 'next' && <NextRaceView />}
                    {view === 'pilot' && <PilotSearchView />}
                </Box>
            </Box>

            {/* FOOTER */}
            <Box marginTop={1} borderStyle="single" borderColor="gray" paddingTop={1} justifyContent="center">
                <Text dimColor>
                    [↑/↓] Navigate  |  [Enter] Select  |  [M] Menu  |  [Q] Quit
                </Text>
            </Box>
        </Box>
    );
};

const args = process.argv.slice(2);
const cmd = args[0]?.toLowerCase();
render(<App initialView={['standings', 'constructors', 'schedule', 'next', 'pilot'].includes(cmd) ? cmd : 'menu'} />);
