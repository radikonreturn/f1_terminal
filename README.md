# F1 Terminal 🏎️

Welcome to the F1 Terminal! This project provides a real-time pit wall experience right in your terminal. It fetches live driver and constructor standings, race schedules, and pilot statistics using the [Jolpi API](https://jolpi.ca/) (an Ergast v1.0.0 compatible mirror).

This repository contains **two distinct implementations**:
1. **Python CLI (`f1.py`)**: A lightweight, dependency-free interactive command-line interface.
2. **React Ink TUI (`f1-ink/`)**: A rich, interactive Terminal User Interface built with React Ink and Node.js.

---

## 🐍 1. Python CLI (`f1.py`)

A pure Python 3 implementation requiring zero third-party packages. It handles network failures and API irregularities gracefully.

### Features
* **Interactive REPL Mode**: Type commands endlessly without restarting the script.
* **Direct Execution**: Run one-off commands (e.g., `python f1.py standings`).
* **Zero Dependencies**: Uses only the Python standard library (`json`, `urllib`).
* **Offline Resilience**: Handles DNS and socket timeouts with user-friendly errors.

### Usage
Run the interactive console:
```bash
python f1.py
```

Or run a command directly:
```bash
python f1.py standings
python f1.py constructors
python f1.py next
```

---

## ⚛️ 2. React Ink TUI (`f1-ink/`)

A fully interactive, keyboard-driven dashboard built with [React Ink](https://github.com/vadimdemedes/ink). It features a polished split-pane layout, real-time countdowns, caching, and pilot search capabilities.

### Features
* **Interactive Navigation**: Use arrow keys (`↑`, `↓`) and `Enter` to browse views.
* **Intelligent Caching**: Minimizes unnecessary network calls (5-minute TTL for standings, 30-sec for race countdowns).
* **Pilot Search**: Live search for your favorite pilots using 3-letter codes (e.g., `VER`, `HAM`) via `ink-text-input`.
* **Rich Visuals**: Team-specific hex colors and Unicode country/race flags.

### Installation
The TUI is published on NPM and can be run immediately without installation:
```bash
npx f1-terminal-cli
```

Or install it globally:
```bash
npm install -g f1-terminal-cli
```
```bash
f1-terminal-cli
```

#### Running from Source
If you want to build and run it locally from source:
```bash
cd f1-ink
npm install
npm run build
npm run run
```

### 🐳 Docker
If you prefer running isolated containers instead of local Node environments, we've included a streamlined `docker-compose` setup.

Interactive shells require capturing TTY input (`-it`), so simply run:
```bash
docker-compose run --rm f1-terminal
```
Or build and run the image yourself manually:
```bash
docker build -t f1-terminal .
docker run -it f1-terminal
```

---

## 🏁 Available Commands & Views

Both implementations support the following data views:

* **`standings`**: Current season Driver Championship standings.
* **`constructors`**: Current season Constructor Championship standings.
* **`schedule`**: Full race calendar for the current season with local time conversions.
* **`next`**: Details for the next upcoming race, including a live countdown timer.
* **`last`**: Race classification and final results for the last completed Grand Prix.
* **`pilot <CODE>`**: Detailed historical statistics (wins, poles, starts) for a specific driver (e.g., VER, HAM, ALO).
* **`drivers`**: A grid list of all active drivers in the current season.

---

## 🏗️ Architecture

* The **Python implementation** uses `threading` to keep a loading spinner active while data is fetched.
* The **Node.js implementation** is bundled into a single file (`dist/index.js`) using ESBuild, making it fast and portable without babel-node at runtime.
* The API backing this project is Jolpi. Because it is public and read-only, we bypass SSL verification in the Python HTTP requests to avoid certificate trust issues on some offline or corporate machines.

---
*Developed for Formula 1 fans who live in the terminal.*
