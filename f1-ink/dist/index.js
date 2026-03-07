// src/index.jsx
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, Newline, Spacer } from "ink";
import Spinner from "ink-spinner";
import chalk from "chalk";
import fetch from "node-fetch";
var BASE = "https://api.jolpi.ca/ergast/f1";
var SEASON = "2026";
var TEAM_COLORS = {
  "Red Bull": "blueBright",
  "Ferrari": "redBright",
  "Mercedes": "cyanBright",
  "McLaren": "yellow",
  "Aston Martin": "green",
  "Alpine": "magentaBright",
  "Williams": "blue",
  "AlphaTauri": "white",
  "RB": "white",
  "Sauber": "greenBright",
  "Haas": "gray"
};
function teamColor(name) {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "greenBright";
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
  "Swiss": "\u{1F1E8}\u{1F1ED}"
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
var Header = ({ title }) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "\u2550".repeat(65)), /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", bold: true }, "  \u{1F3CE}\uFE0F  ", title.toUpperCase()), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "\u2550".repeat(65)));
var Loading = ({ label }) => /* @__PURE__ */ React.createElement(Box, { marginY: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), " ", label, "..."));
var Medal = ({ pos }) => {
  if (pos === "1" || pos === 1) return /* @__PURE__ */ React.createElement(Text, { color: "yellowBright" }, "\u{1F947}");
  if (pos === "2" || pos === 2) return /* @__PURE__ */ React.createElement(Text, { color: "whiteBright" }, "\u{1F948}");
  if (pos === "3" || pos === 3) return /* @__PURE__ */ React.createElement(Text, { color: "redBright" }, "\u{1F949}");
  return /* @__PURE__ */ React.createElement(Text, null, "  ");
};
var Err = ({ msg }) => /* @__PURE__ */ React.createElement(Box, { marginY: 1, paddingX: 2, borderStyle: "single", borderColor: "red" }, /* @__PURE__ */ React.createElement(Text, { color: "redBright", bold: true }, "ERROR: "), /* @__PURE__ */ React.createElement(Text, { color: "red" }, msg));
var apiFetch = async (endpoint) => {
  try {
    const res = await fetch(`${BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    return await res.json();
  } catch (err) {
    throw new Error(err.message.includes("fetch") ? `Network error: Cannot reach Ergast API.` : err.message);
  }
};
var StandingsView = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    apiFetch(`/${SEASON}/driverStandings.json`).then((d) => setData(d.MRData.StandingsTable.StandingsLists[0]?.DriverStandings)).catch((e) => setErr(e.message));
  }, []);
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: "Fetching driver standings" });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Header, { title: `Driver Standings ${SEASON}` }), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, pad("POS", 4), " ", pad("DRIVER", 22), " ", pad("TEAM", 25), " ", "PTS")), data.map((d) => {
    const team = d.Constructors[0]?.name || "Unknown";
    const name = `${d.Driver.givenName[0]} ${d.Driver.familyName}`;
    return /* @__PURE__ */ React.createElement(Box, { key: d.Driver.driverId }, /* @__PURE__ */ React.createElement(Box, { width: 4 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, pad(d.position, 2, true), " ")), /* @__PURE__ */ React.createElement(Box, { width: 3 }, /* @__PURE__ */ React.createElement(Medal, { pos: d.position })), /* @__PURE__ */ React.createElement(Box, { width: 22 }, /* @__PURE__ */ React.createElement(Text, { color: "white" }, name)), /* @__PURE__ */ React.createElement(Box, { width: 25 }, /* @__PURE__ */ React.createElement(Text, { color: teamColor(team) }, team)), /* @__PURE__ */ React.createElement(Text, { color: "greenBright", bold: true }, pad(d.points, 4, true)));
  }));
};
var ConstructorsView = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    apiFetch(`/${SEASON}/constructorStandings.json`).then((d) => setData(d.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings)).catch((e) => setErr(e.message));
  }, []);
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: "Fetching constructor standings" });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Header, { title: `Constructor Standings ${SEASON}` }), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, pad("POS", 4), " ", pad("TEAM", 25), " ", pad("NAT", 6), " ", pad("WINS", 6), " ", "PTS")), data.map((d) => {
    const team = d.Constructor.name;
    const flag = getFlag(d.Constructor.nationality, NAT_FLAGS);
    return /* @__PURE__ */ React.createElement(Box, { key: d.Constructor.constructorId }, /* @__PURE__ */ React.createElement(Box, { width: 4 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, pad(d.position, 2, true), " ")), /* @__PURE__ */ React.createElement(Box, { width: 3 }, /* @__PURE__ */ React.createElement(Medal, { pos: d.position })), /* @__PURE__ */ React.createElement(Box, { width: 25 }, /* @__PURE__ */ React.createElement(Text, { color: teamColor(team) }, team)), /* @__PURE__ */ React.createElement(Box, { width: 6 }, /* @__PURE__ */ React.createElement(Text, null, flag)), /* @__PURE__ */ React.createElement(Box, { width: 6 }, /* @__PURE__ */ React.createElement(Text, null, pad(d.wins, 4, true))), /* @__PURE__ */ React.createElement(Text, { color: "greenBright", bold: true }, pad(d.points, 4, true)));
  }));
};
var ScheduleView = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    apiFetch(`/${SEASON}.json`).then((d) => setData(d.MRData.RaceTable.Races)).catch((e) => setErr(e.message));
  }, []);
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: "Fetching schedule" });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Header, { title: `Race Schedule ${SEASON}` }), data.map((r) => {
    const flag = getFlag(r.Circuit.Location.country, RACE_FLAGS);
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", key: r.round, marginBottom: 1 }, /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, pad(r.round, 2, true), "."), /* @__PURE__ */ React.createElement(Text, null, " ", flag, " "), /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", bold: true }, pad(r.raceName, 30)), /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, pad(r.date, 12)), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, r.time?.replace("Z", "") || "TBD")), /* @__PURE__ */ React.createElement(Box, { paddingLeft: 7 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, r.Circuit.circuitName, ", ", r.Circuit.Location.locality)));
  }));
};
var LastRaceView = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    apiFetch(`/current/last/results.json`).then((d) => setData(d.MRData.RaceTable.Races[0])).catch((e) => setErr(e.message));
  }, []);
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: "Fetching last race" });
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Header, { title: "Last Race Results" }), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "cyanBright" }, "Round ", data.round, ": ", data.raceName)), /* @__PURE__ */ React.createElement(Box, { marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, pad("POS", 4), " ", pad("DRIVER", 22), " ", pad("TEAM", 25), " ", "TIME/STATUS")), data.Results.map((r) => {
    const team = r.Constructor.name;
    const name = `${r.Driver.givenName[0]} ${r.Driver.familyName}`;
    const timeStr = r.Time ? r.Time.time : r.status;
    const isFinished = !timeStr.includes("Laps") && timeStr !== "Finished";
    return /* @__PURE__ */ React.createElement(Box, { key: r.position }, /* @__PURE__ */ React.createElement(Box, { width: 4 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, pad(r.position, 3, true))), /* @__PURE__ */ React.createElement(Box, { width: 22 }, /* @__PURE__ */ React.createElement(Text, { color: "white" }, name)), /* @__PURE__ */ React.createElement(Box, { width: 25 }, /* @__PURE__ */ React.createElement(Text, { color: teamColor(team) }, team)), /* @__PURE__ */ React.createElement(Text, { color: isFinished ? "greenBright" : "gray" }, timeStr));
  }));
};
var NextRaceView = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    apiFetch(`/current.json`).then((d) => {
      const races = d.MRData.RaceTable.Races;
      const now = /* @__PURE__ */ new Date();
      let nextRace = null;
      for (const r of races) {
        const dateStr = r.date;
        const timeStr = r.time || "00:00:00Z";
        const rDt = /* @__PURE__ */ new Date(`${dateStr}T${timeStr}`);
        if (rDt > now) {
          nextRace = { ...r, rDt };
          break;
        }
      }
      setData(nextRace || { noRaces: true });
    }).catch((e) => setErr(e.message));
  }, []);
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: "Fetching next race" });
  if (data.noRaces) {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Header, { title: "Next Race" }), /* @__PURE__ */ React.createElement(Text, null, "No upcoming races found for this season."));
  }
  const diff = data.rDt - /* @__PURE__ */ new Date();
  const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1e3 * 60 * 60) % 24);
  const minutes = Math.floor(diff / 1e3 / 60 % 60);
  const flag = getFlag(data.Circuit.Location.country, RACE_FLAGS);
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: "Next Race" }), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginY: 1 }, /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, null, flag, " "), /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", bold: true }, data.raceName)), /* @__PURE__ */ React.createElement(Box, { paddingLeft: 4 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Location: ", data.Circuit.circuitName, ", ", data.Circuit.Location.locality)), /* @__PURE__ */ React.createElement(Box, { paddingLeft: 4 }, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, "Date:     ", data.date, " at ", data.time?.replace("Z", "") || "00:00:00")), /* @__PURE__ */ React.createElement(Box, { paddingLeft: 4, marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "Starts in: ", days, "d ", hours, "h ", minutes, "m"))));
};
var PilotView = ({ pilotCode }) => {
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
        const activeRes = await apiFetch("/current/drivers.json");
        let driver2 = activeRes.MRData.DriverTable.Drivers.find((d) => d.code === code);
        let driverId = "";
        if (!driver2) {
          driverId = pilotCode.toLowerCase();
          try {
            const singleRes = await apiFetch(`/drivers/${driverId}.json`);
            if (singleRes.MRData.total === "0") {
              setErr(`Driver '${code}' not found in active grid. Use full driverId for historical pilots.`);
              return;
            }
            driver2 = singleRes.MRData.DriverTable.Drivers[0];
          } catch (e) {
            setErr(`Driver '${code}' not found.`);
            return;
          }
        } else {
          driverId = driver2.driverId;
        }
        const [winsRes, polesRes, startsRes] = await Promise.all([
          apiFetch(`/drivers/${driverId}/results/1.json?limit=1`),
          apiFetch(`/drivers/${driverId}/qualifying/1.json?limit=1`),
          apiFetch(`/drivers/${driverId}/results.json?limit=1`)
        ]);
        const wdcMap = {
          "michael_schumacher": 7,
          "hamilton": 7,
          "fangio": 5,
          "prost": 4,
          "vettel": 4,
          "max_verstappen": 4,
          "brabham": 3,
          "stewart": 3,
          "lauda": 3,
          "piquet": 3,
          "senna": 3,
          "alonso": 2,
          "hakkinen": 2,
          "fittipaldi": 2,
          "clark": 2,
          "ascari": 2,
          "raikkonen": 1,
          "rosberg": 1,
          "nico_rosberg": 1,
          "button": 1,
          "villeneuve": 1,
          "damon_hill": 1,
          "mansell": 1,
          "andretti": 1,
          "hunt": 1,
          "scheckter": 1,
          "jones": 1,
          "surtees": 1,
          "phil_hill": 1,
          "hawthorn": 1,
          "farina": 1
        };
        setData({
          driver: driver2,
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
  if (err) return /* @__PURE__ */ React.createElement(Err, { msg: err });
  if (!data) return /* @__PURE__ */ React.createElement(Loading, { label: `Searching Driver Info` });
  const { driver, wins, poles, starts, champs } = data;
  const flag = getFlag(driver.nationality, NAT_FLAGS);
  const name = `${driver.givenName} ${driver.familyName}`;
  const number = driver.permanentNumber || "N/A";
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, /* @__PURE__ */ React.createElement(Header, { title: `Pilot Profile: ${pilotCode.toUpperCase()}` }), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginY: 1 }, /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, null, flag, " "), /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", bold: true }, name), /* @__PURE__ */ React.createElement(Text, null, "  |  #", number, "  |  ", driver.dateOfBirth)), /* @__PURE__ */ React.createElement(Box, { marginTop: 1, paddingLeft: 4, flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { color: "yellowBright" }, "World Championships: "), /* @__PURE__ */ React.createElement(Text, { bold: true }, champs)), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { color: "greenBright" }, "All-Time Wins:       "), /* @__PURE__ */ React.createElement(Text, { bold: true }, wins)), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { color: "cyanBright" }, "Pole Positions:      "), /* @__PURE__ */ React.createElement(Text, { bold: true }, poles)), /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Race Starts:         "), /* @__PURE__ */ React.createElement(Text, { bold: true }, starts)))));
};
var VIEWS = {
  standings: /* @__PURE__ */ React.createElement(StandingsView, null),
  constructors: /* @__PURE__ */ React.createElement(ConstructorsView, null),
  schedule: /* @__PURE__ */ React.createElement(ScheduleView, null),
  next: /* @__PURE__ */ React.createElement(NextRaceView, null),
  last: /* @__PURE__ */ React.createElement(LastRaceView, null)
};
var MENU_ITEMS = [
  { key: "1", name: "Driver Standings", view: "standings" },
  { key: "2", name: "Constructor Standings", view: "constructors" },
  { key: "3", name: "Race Schedule", view: "schedule" },
  { key: "4", name: "Next Race", view: "next" },
  { key: "5", name: "Last Race Results", view: "last" },
  { key: "q", name: "Quit", view: "quit" }
];
var App = ({ initialView, pilotCode }) => {
  const [currentView, setCurrentView] = useState(initialView || "menu");
  useInput((input, key) => {
    if (currentView !== "menu") {
      if (input.toLowerCase() === "b" || key.escape || input.toLowerCase() === "m") {
        setCurrentView("menu");
      } else if (input.toLowerCase() === "q") {
        process.exit(0);
      }
      return;
    }
    const item = MENU_ITEMS.find((m) => m.key === input.toLowerCase());
    if (item) {
      if (item.view === "quit") process.exit(0);
      else setCurrentView(item.view);
    }
  });
  if (currentView !== "menu" && VIEWS[currentView]) {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 1 }, VIEWS[currentView], /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Press "), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "[M]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " or "), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "[B]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " to return to menu, "), /* @__PURE__ */ React.createElement(Text, { color: "redBright", bold: true }, "[Q]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " to quit.")));
  }
  if (currentView === "pilot") {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 1 }, /* @__PURE__ */ React.createElement(PilotView, { pilotCode }), /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, "Press "), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "[M]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " or "), /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "[B]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " to return to menu, "), /* @__PURE__ */ React.createElement(Text, { color: "redBright", bold: true }, "[Q]"), /* @__PURE__ */ React.createElement(Text, { dimColor: true }, " to quit.")));
  }
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 2, borderStyle: "round", borderColor: "redBright" }, /* @__PURE__ */ React.createElement(Box, { justifyContent: "center", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "redBright", bold: true }, "F1 TERMINAL DASHBOARD")), /* @__PURE__ */ React.createElement(Box, { justifyContent: "center", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "whiteBright", italic: true }, "Interactive Terminal Dashboard")), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginX: 4, marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true, marginBottom: 1 }, "Select an option:"), MENU_ITEMS.map((m) => /* @__PURE__ */ React.createElement(Box, { key: m.key }, /* @__PURE__ */ React.createElement(Text, { color: "yellowBright", bold: true }, "[", m.key, "]"), /* @__PURE__ */ React.createElement(Text, null, "  ", m.name)))));
};
var args = process.argv.slice(2);
if (!args[0]) {
  render(/* @__PURE__ */ React.createElement(App, null));
} else {
  const cmd = args[0].toLowerCase();
  if (["standings", "constructors", "schedule", "next", "last", "pilot"].includes(cmd)) {
    render(/* @__PURE__ */ React.createElement(App, { initialView: cmd, pilotCode: args[1] }));
  } else {
    console.log(chalk.red.bold("\nF1 Terminal CLI - Error"));
    console.log(`Unknown command: ${cmd}
`);
    console.log(chalk.bold("Available commands:"));
    console.log(`  ${chalk.green("standings")}    - Show driver standings`);
    console.log(`  ${chalk.green("constructors")} - Show constructor standings`);
    console.log(`  ${chalk.green("schedule")}     - Show race schedule`);
    console.log(`  ${chalk.green("next")}         - Show next upcoming race and countdown`);
    console.log(`  ${chalk.green("last")}         - Show last race results`);
    console.log(`  ${chalk.green("pilot VER")}    - Show historical stats for a pilot`);
    console.log(`
Run without arguments for interactive menu.`);
    process.exit(0);
  }
}
