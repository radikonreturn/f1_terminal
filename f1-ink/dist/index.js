#!/usr/bin/env node

// src/index.jsx
import React, { useState, useEffect, useRef } from "react";
import { render, Box, Text, useInput, Newline, Spacer } from "ink";
import Spinner from "ink-spinner";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import chalk from "chalk";
import fetch from "node-fetch";
var BASE = "https://api.jolpi.ca/ergast/f1";
var SEASON = "2026";
var TEAM_COLORS = {
  "Red Bull Racing": "#3671C6",
  "Red Bull": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#358C75",
  "Alpine F1 Team": "#FF87BC",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB F1 Team": "#6692FF",
  "RB": "#6692FF",
  "Haas F1 Team": "#B6BABD",
  "Haas": "#B6BABD",
  "Sauber/Kick": "#52E252",
  "Sauber": "#52E252",
  "Audi": "#52E252"
  // Using Sauber's color temporarily until Audi rebranding is official
};
function teamColor(name) {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return chalk.hex(v);
  }
  return chalk.gray;
}
var NAT_FLAGS = {
  "Dutch": "\u{1F1F3}\u{1F1F1}",
  "British": "\u{1F1EC}\u{1F1E7}",
  "Monegasque": "\u{1F1F2}\u{1F1E8}",
  "Spanish": "\u{1F1EA}\u{1F1F8}",
  "Australian": "\u{1F1E6}\u{1F1FA}",
  "Mexican": "\u{1F1F2}\u{1F1FD}",
  "French": "\u{1F1EB}\u{1F1F7}",
  "Japanese": "\u{1F1EF}\u{1F1F5}",
  "Canadian": "\u{1F1E8}\u{1F1E6}",
  "German": "\u{1F1E9}\u{1F1EA}",
  "Thai": "\u{1F1F9}\u{1F1ED}",
  "Danish": "\u{1F1E9}\u{1F1F0}",
  "Finnish": "\u{1F1EB}\u{1F1EE}",
  "Chinese": "\u{1F1E8}\u{1F1F3}",
  "American": "\u{1F1FA}\u{1F1F8}",
  "New Zealander": "\u{1F1F3}\u{1F1FF}",
  "Italian": "\u{1F1EE}\u{1F1F9}",
  "Austrian": "\u{1F1E6}\u{1F1F9}",
  "Swiss": "\u{1F1E8}\u{1F1ED}",
  "Argentine": "\u{1F1E6}\u{1F1F7}",
  "Brazilian": "\u{1F1E7}\u{1F1F7}"
};
var RACE_FLAGS = {
  "Bahrain": "\u{1F1E7}\u{1F1ED}",
  "Saudi Arabia": "\u{1F1F8}\u{1F1E6}",
  "Australia": "\u{1F1E6}\u{1F1FA}",
  "Japan": "\u{1F1EF}\u{1F1F5}",
  "China": "\u{1F1E8}\u{1F1F3}",
  "USA": "\u{1F1FA}\u{1F1F8}",
  "United States": "\u{1F1FA}\u{1F1F8}",
  "Italy": "\u{1F1EE}\u{1F1F9}",
  "Monaco": "\u{1F1F2}\u{1F1E8}",
  "Canada": "\u{1F1E8}\u{1F1E6}",
  "Spain": "\u{1F1EA}\u{1F1F8}",
  "Austria": "\u{1F1E6}\u{1F1F9}",
  "UK": "\u{1F1EC}\u{1F1E7}",
  "Hungary": "\u{1F1ED}\u{1F1FA}",
  "Belgium": "\u{1F1E7}\u{1F1EA}",
  "Netherlands": "\u{1F1F3}\u{1F1F1}",
  "Azerbaijan": "\u{1F1E6}\u{1F1FF}",
  "Singapore": "\u{1F1F8}\u{1F1EC}",
  "Brazil": "\u{1F1E7}\u{1F1F7}",
  "Mexico": "\u{1F1F2}\u{1F1FD}",
  "Qatar": "\u{1F1F6}\u{1F1E6}",
  "UAE": "\u{1F1E6}\u{1F1EA}"
};
function getFlag(nat, map) {
  return map[nat] || "\u{1F3C1}";
}
function pad(str, len, right = false) {
  const s = String(str ?? "");
  if (right) return s.padStart(len).slice(0, len);
  return s.padEnd(len).slice(0, len);
}
var AsciiHeader = () => {
  const lines = [
    "  ___ _   _____              _           _ ",
    " | __/ | |_   _|___ _ _ _ __(_)_ _  __ _| |",
    " | _|| |   | |/ -_) '_| '  \\| | ' \\/ _` | |",
    " |_| |_|   |_|\\___|_| |_|_|_|_|_||_\\__,_|_|"
  ];
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", marginBottom: 1 }, lines.map((line, i) => /* @__PURE__ */ React.createElement(Text, { key: i, color: "redBright", bold: true, wrap: "none" }, line)));
};
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL = { LONG: 5 * 60 * 1e3, SHORT: 30 * 1e3 };
var apiFetch = async (endpoint, ttl = CACHE_TTL.LONG) => {
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
    throw new Error(err.message.includes("fetch") ? `Network Error: Cannot reach API.` : err.message);
  }
};
var Header = ({ title, isCached, isOffline }) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, "\u{1F3CE}\uFE0F  ", title.toUpperCase()), /* @__PURE__ */ React.createElement(Box, null, isOffline && /* @__PURE__ */ React.createElement(Text, { color: "redBright" }, " \u26A0\uFE0F OFFLINE "), isCached && !isOffline && /* @__PURE__ */ React.createElement(Text, { color: "gray" }, " \u{1F4E6} CACHED ")));
var Err = ({ msg }) => /* @__PURE__ */ React.createElement(Box, { marginY: 1, padding: 1, borderStyle: "single", borderColor: "red" }, /* @__PURE__ */ React.createElement(Text, { color: "redBright", bold: true }, "ERROR: "), /* @__PURE__ */ React.createElement(Text, { color: "red" }, msg, " "), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "(Press [R] to retry)"));
var Medal = ({ pos }) => {
  if (pos === "1" || pos === 1) return /* @__PURE__ */ React.createElement(Text, { color: "#FFD700" }, "\u{1F947}");
  if (pos === "2" || pos === 2) return /* @__PURE__ */ React.createElement(Text, { color: "#C0C0C0" }, "\u{1F948}");
  if (pos === "3" || pos === 3) return /* @__PURE__ */ React.createElement(Text, { color: "#CD7F32" }, "\u{1F949}");
  return /* @__PURE__ */ React.createElement(Text, null, "  ");
};
var useF1Data = (endpoint, ttl = CACHE_TTL.LONG, dependencies = []) => {
  const [state, setState] = useState({ data: null, err: null, loading: true, cached: false, offline: false });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let isMounted = true;
    setState((s) => ({ ...s, loading: true, err: null }));
    apiFetch(endpoint, ttl).then((res) => {
      if (isMounted) setState({ data: res.data, err: null, loading: false, cached: res.cached, offline: res.offline });
    }).catch((err) => {
      if (isMounted) setState({ data: null, err: err.message, loading: false, cached: false, offline: false });
    });
    return () => {
      isMounted = false;
    };
  }, [endpoint, tick, ...dependencies]);
  const refresh = () => setTick((t) => t + 1);
  return { ...state, refresh };
};
var TableRow = ({ cols, widthArr, dim = false }) => /* @__PURE__ */ React.createElement(Box, null, cols.map((col, i) => /* @__PURE__ */ React.createElement(Box, { key: i, width: widthArr[i] }, typeof col === "string" || typeof col === "number" ? /* @__PURE__ */ React.createElement(Text, { dimColor: dim }, col) : col)));
var StandingsView = () => {
  const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}/driverStandings.json`, CACHE_TTL.LONG);
  useInput((input) => {
    if (input.toLowerCase() === "r") refresh();
  });
  if (loading) return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, " Fetching standings..."));
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  const tableData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
  const widths = [6, 4, 25, 25, 6];
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: `Driver Standings ${SEASON}`, isCached: cached, isOffline: offline }), /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(TableRow, { cols: ["POS", "", "DRIVER", "TEAM", "PTS"], widthArr: widths, dim: true }), tableData.map((d, i) => {
    const team = d.Constructors[0]?.name || "Unknown";
    const name = `${d.Driver.givenName[0]} ${d.Driver.familyName}`;
    const pos = d.position || d.positionText || "-";
    const pts = d.points || "0";
    const isMedal = ["1", "2", "3"].includes(pos);
    const isDim = i > 9 && !isMedal;
    return /* @__PURE__ */ React.createElement(
      TableRow,
      {
        key: d.Driver.driverId,
        widths,
        dim: isDim,
        cols: [
          /* @__PURE__ */ React.createElement(Text, { bold: isMedal }, pad(pos, 3, true)),
          /* @__PURE__ */ React.createElement(Medal, { pos }),
          /* @__PURE__ */ React.createElement(Text, { color: isMedal ? "whiteBright" : "white", dimColor: isDim }, name),
          /* @__PURE__ */ React.createElement(Text, null, teamColor(team)(team)),
          /* @__PURE__ */ React.createElement(Text, { color: "greenBright", bold: true }, pad(pts, 4, true))
        ],
        widthArr: widths
      }
    );
  })));
};
var ConstructorsView = () => {
  const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}/constructorStandings.json`, CACHE_TTL.LONG);
  useInput((input) => {
    if (input.toLowerCase() === "r") refresh();
  });
  if (loading) return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, " Fetching constructors..."));
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  const tableData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
  const widths = [6, 4, 25, 6, 6, 6];
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: `Constructor Standings ${SEASON}`, isCached: cached, isOffline: offline }), /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(TableRow, { cols: ["POS", "", "TEAM", "NAT", "WINS", "PTS"], widthArr: widths, dim: true }), tableData.map((d, i) => {
    const team = d.Constructor.name;
    const flag = getFlag(d.Constructor.nationality, NAT_FLAGS);
    const pos = d.position || d.positionText || "-";
    const pts = d.points || "0";
    const wins = d.wins || "0";
    const isDim = i > 4;
    return /* @__PURE__ */ React.createElement(
      TableRow,
      {
        key: d.Constructor.constructorId,
        widthArr: widths,
        cols: [
          /* @__PURE__ */ React.createElement(Text, { bold: true }, pad(pos, 3, true)),
          /* @__PURE__ */ React.createElement(Medal, { pos }),
          /* @__PURE__ */ React.createElement(Text, null, teamColor(team)(team)),
          /* @__PURE__ */ React.createElement(Text, null, flag),
          /* @__PURE__ */ React.createElement(Text, { dimColor: isDim }, pad(wins, 4, true)),
          /* @__PURE__ */ React.createElement(Text, { color: "greenBright", bold: true }, pad(pts, 4, true))
        ]
      }
    );
  })));
};
var ScheduleView = () => {
  const { data, err, loading, cached, offline, refresh } = useF1Data(`/${SEASON}.json`, CACHE_TTL.LONG);
  useInput((input) => {
    if (input.toLowerCase() === "r") refresh();
  });
  if (loading) return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, " Fetching schedule..."));
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  const races = data?.MRData?.RaceTable?.Races || [];
  const widths = [6, 4, 32, 12, 16];
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: `Race Schedule ${SEASON}`, isCached: cached, isOffline: offline }), /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(TableRow, { cols: ["RND", "", "GRAND PRIX", "DATE", "TIME (UTC+3)"], widthArr: widths, dim: true }), races.map((r) => {
    const flag = getFlag(r.Circuit.Location.country, RACE_FLAGS);
    let dateStr = r.date;
    let timeStr = r.time ? r.time.replace("Z", "") : "TBD";
    if (r.time) {
      const rDt = /* @__PURE__ */ new Date(`${r.date}T${r.time}`);
      const gmt3 = new Date(rDt.getTime() + 3 * 3600 * 1e3);
      dateStr = gmt3.toISOString().split("T")[0];
      timeStr = gmt3.toISOString().split("T")[1].substring(0, 5);
    }
    return /* @__PURE__ */ React.createElement(
      TableRow,
      {
        key: r.round,
        widthArr: widths,
        cols: [
          /* @__PURE__ */ React.createElement(Text, { dimColor: true }, pad(r.round, 3, true)),
          /* @__PURE__ */ React.createElement(Text, null, flag),
          /* @__PURE__ */ React.createElement(Text, { color: "whiteBright" }, r.raceName),
          /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, dateStr),
          /* @__PURE__ */ React.createElement(Text, { dimColor: true }, timeStr)
        ]
      }
    );
  })));
};
var NextRaceView = () => {
  const { data, err, loading, cached, offline, refresh } = useF1Data(`/current.json`, CACHE_TTL.SHORT);
  const [timeLeft, setTimeLeft] = useState("");
  useInput((input) => {
    if (input.toLowerCase() === "r") refresh();
  });
  useEffect(() => {
    if (!data) return;
    const races = data.MRData.RaceTable.Races;
    const now = /* @__PURE__ */ new Date();
    let next = null;
    for (const r of races) {
      const dateStr = r.date;
      const timeStr = r.time || "00:00:00Z";
      const rDt = /* @__PURE__ */ new Date(`${dateStr}T${timeStr}`);
      if (rDt > now) {
        next = { ...r, rDt };
        break;
      }
    }
    if (!next) {
      setTimeLeft("End of season");
      return;
    }
    const iv = setInterval(() => {
      const diff = next.rDt - /* @__PURE__ */ new Date();
      const d = Math.floor(diff / (1e3 * 60 * 60 * 24));
      const h = Math.floor(diff / (1e3 * 60 * 60) % 24);
      const m = Math.floor(diff / 1e3 / 60 % 60);
      const s = Math.floor(diff / 1e3 % 60);
      setTimeLeft(`${d}d ${h}h ${m}m ${pad(s, 2, true)}s`);
    }, 1e3);
    return () => clearInterval(iv);
  }, [data]);
  if (loading) return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, " Fetching next race..."));
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: "Next Race Countdown", isCached: cached, isOffline: offline }), /* @__PURE__ */ React.createElement(Box, { borderStyle: "round", borderColor: "greenBright", flexDirection: "column", paddingX: 2, paddingY: 1 }, /* @__PURE__ */ React.createElement(Text, null, "Upcoming race details are live calculating..."), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true, marginTop: 1 }, "STARTS IN: ", timeLeft), /* @__PURE__ */ React.createElement(Text, { dimColor: true, marginTop: 1 }, "(Press [R] to update schedule payload)")));
};
var PilotSearchView = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useInput((input, key) => {
    if (key.return && query.length > 0) {
      setSubmitted(true);
    } else if (!submitted) {
      if (/^[a-zA-Z]$/.test(input) && query.length < 5) {
        setQuery((prev) => (prev + input).toUpperCase());
      } else if (key.backspace || key.delete) {
        setQuery((prev) => prev.slice(0, -1));
      }
    } else if (input.toLowerCase() === "r") {
      setSubmitted(false);
      setQuery("");
    }
  });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: "Pilot Search", isCached: false, isOffline: false }), !submitted ? /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "blueBright", padding: 1 }, /* @__PURE__ */ React.createElement(Text, null, "Enter 3-Letter Driver Code (e.g., VER, HAM, LEC): "), /* @__PURE__ */ React.createElement(Text, { color: "cyanBright", bold: true }, query), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }))) : /* @__PURE__ */ React.createElement(PilotResults, { code: query }));
};
var PilotResults = ({ code }) => {
  const { data: activeData, err: err1, loading: l1 } = useF1Data("/current/drivers.json");
  const [stats, setStats] = useState({ loading: true, data: null, err: null });
  useEffect(() => {
    if (!activeData && !err1) return;
    const fetchStats = async () => {
      try {
        let driver2 = null, driverId = "";
        if (activeData?.MRData?.DriverTable?.Drivers) {
          driver2 = activeData.MRData.DriverTable.Drivers.find((d) => d.code === code);
        }
        if (!driver2) {
          driverId = code.toLowerCase();
          const res = await apiFetch(`/drivers/${driverId}.json`);
          if (res.data.MRData.total === "0") throw new Error(`Not found: ${code}`);
          driver2 = res.data.MRData.DriverTable.Drivers[0];
        } else {
          driverId = driver2.driverId;
        }
        const [wRes, pRes, sRes] = await Promise.all([
          apiFetch(`/drivers/${driverId}/results/1.json?limit=1`),
          apiFetch(`/drivers/${driverId}/qualifying/1.json?limit=1`),
          apiFetch(`/drivers/${driverId}/results.json?limit=1`)
        ]);
        setStats({
          loading: false,
          err: null,
          data: {
            driver: driver2,
            wins: wRes.data.MRData.total,
            poles: pRes.data.MRData.total,
            starts: sRes.data.MRData.total
          }
        });
      } catch (e) {
        setStats({ loading: false, err: e.message, data: null });
      }
    };
    fetchStats();
  }, [activeData, err1, code]);
  if (l1 || stats.loading) return /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, " Fetching stats for ", code, "..."));
  if (err1 || stats.err) return /* @__PURE__ */ React.createElement(Err, { msg: err1 || stats.err });
  const { driver, wins, poles, starts } = stats.data;
  const flag = getFlag(driver.nationality, NAT_FLAGS);
  return /* @__PURE__ */ React.createElement(Box, { borderStyle: "round", borderColor: "cyanBright", flexDirection: "column", paddingX: 2, paddingY: 1 }, /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, null, flag, " "), /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", bold: true }, driver.givenName, " ", driver.familyName), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "  |  #", driver.permanentNumber || "N/A", "  |  ", driver.dateOfBirth)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingLeft: 4 }, /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { color: "greenBright" }, "All-Time Wins:       "), /* @__PURE__ */ React.createElement(Text, { bold: true }, wins)), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { color: "cyanBright" }, "Pole Positions:      "), /* @__PURE__ */ React.createElement(Text, { bold: true }, poles)), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Race Starts:         "), /* @__PURE__ */ React.createElement(Text, { bold: true }, starts))), /* @__PURE__ */ React.createElement(Text, { dimColor: true, marginTop: 1 }, "(Press [R] to search another pilot, or [M] for Menu)"));
};
var items = [
  { label: "Driver Standings", value: "standings" },
  { label: "Constructor Standings", value: "constructors" },
  { label: "Race Schedule", value: "schedule" },
  { label: "Next Race Countdown", value: "next" },
  { label: "Pilot Search", value: "pilot" },
  { label: "Quit", value: "quit" }
];
var App = ({ initialView }) => {
  const [view, setView] = useState(initialView || "menu");
  useInput((input, key) => {
    if (input.toLowerCase() === "m" || input.toLowerCase() === "b" || key.escape) {
      setView("menu");
    } else if (input.toLowerCase() === "q") {
      process.exit(0);
    }
  });
  const handleSelect = (item) => {
    if (item.value === "quit") process.exit(0);
    setView(item.value);
  };
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "red", padding: 1 }, /* @__PURE__ */ React.createElement(AsciiHeader, null), /* @__PURE__ */ React.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React.createElement(Box, { width: 30, borderStyle: "single", borderColor: "gray", flexDirection: "column", paddingRight: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, marginBottom: 1, color: "magentaBright" }, "\u{1F3C1} NAVIGATION"), view === "menu" ? /* @__PURE__ */ React.createElement(SelectInput, { items, onSelect: handleSelect }) : /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, items.map((i) => /* @__PURE__ */ React.createElement(Text, { key: i.value, color: i.value === view ? "greenBright" : "gray" }, i.value === view ? "\u25B6 " : "  ", i.label)))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, paddingLeft: 2 }, view === "menu" && /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Select an option from the left to begin."), view === "standings" && /* @__PURE__ */ React.createElement(StandingsView, null), view === "constructors" && /* @__PURE__ */ React.createElement(ConstructorsView, null), view === "schedule" && /* @__PURE__ */ React.createElement(ScheduleView, null), view === "next" && /* @__PURE__ */ React.createElement(NextRaceView, null), view === "pilot" && /* @__PURE__ */ React.createElement(PilotSearchView, null))), /* @__PURE__ */ React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingTop: 1, justifyContent: "center" }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "[\u2191/\u2193] Navigate  |  [Enter] Select  |  [M] Menu  |  [Q] Quit")));
};
var args = process.argv.slice(2);
var cmd = args[0]?.toLowerCase();
render(/* @__PURE__ */ React.createElement(App, { initialView: ["standings", "constructors", "schedule", "next", "pilot"].includes(cmd) ? cmd : "menu" }));
