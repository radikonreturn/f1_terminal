# F1 Terminal Dashboard 🏎️🏁

Turn your standard terminal into a real-time pit wall! A dual-implementation Formula 1 CLI that fetches live standings, schedules, recent race results, and driver profiles from the [Jolpi API](https://jolpi.ca) (Ergast v1.0.0 compatible mirror) and renders them in your terminal with rich colors, flags, and countdown timers.

Built in two flavors:
- **🐍 `f1.py`** — Pure Python 3, zero third-party dependencies, features an interactive REPL or direct CLI execution.
- **⚛️ `f1-ink/`** — React Ink (Node.js) TUI providing a dynamic, full-color, interactive menu navigation experience.

---

## 🏎️ Commands & Features

Both implementations support the same core dataset and direct commands:

- `standings` — Shows the current Driver Championship standings.
- `constructors` — Shows the current Constructor Championship standings.
- `drivers` — Displays the active grid of drivers/pilots, including permanent numbers and 3-letter codes.
- `schedule` — Displays the full, timezone-adjusted race calendar for the current season.
- `next` — Shows the details of the next upcoming race along with a live **countdown timer**.
- `last` — Displays the detailed classification results and lap times/status of the last completed race.
- `pilot <CODE>` — Fetches a specific driver's profile and historical stats (e.g., `pilot VER` or `pilot HAM`).
- `help` — Lists all available commands.

---

## 🐍 1. Python Version (`f1.py`)

No dependencies, no downloads, fast and lightweight! Uses only the Python standard library. It is designed to be completely resilient against crashes (e.g., missing API fields or offline DNS errors).

### Usage

**Interactive REPL Mode:**
Open your terminal and simply run:
```bash
python f1.py
```
This drops you into an interactive `f1>` console where you can type commands endlessly.

**Direct Command Mode:**
If you want to view a single table quickly and exit:
```bash
python f1.py standings
python f1.py next
python f1.py pilot ALO
```

*(Note: If you're on Windows, UTF-8 emoji and ANSI color support issues are natively handled inside the script using `sys.reconfigure` and `kernel32` patches).*

---

## ⚛️ 2. React Ink Version (`f1-ink`)

A full-color, dynamic Terminal User Interface (TUI) built using Node.js and React Ink. It compiles down to a single bundle via ESBuild for extremely fast execution.

### Installation & Usage

Ensure you have Node.js and npm installed on your system.

```bash
cd f1-ink
npm install
npm run build
```

**Interactive Menu (TUI):**
Start the visual dashboard:
```bash
npm start
```
Use the keyboard keys (`1`, `2`, `3`, `4`, `5`, `6`) to navigate through the menus. Press `[M]` or `[B]` to return to the main menu and `[Q]` to quit.

**Direct Command Mode:**
You can also pass arguments directly to the Node script:
```bash
npm start standings
npm start pilot LEC
```

---

## 🛠️ Architecture & Resilience

* **Zero-Dependency Python Threads:** The Python version uses standard library `urllib` wrapped within a `threading.Thread` to display an animated spinner while fetching data. It handles 10-second timeouts gracefully.
* **ESBuild Integration:** React Ink utilizes JSX. To avoid requiring `babel-node` in production, the `package.json` uses ESBuild to bundle the source code directly into an ESM JavaScript file (`dist/index.js`) on the fly.
* **Offline & DNS Fallbacks:** If your internet disconnects or DNS resolution fails (`getaddrinfo` errors), the terminal catches it and displays a readable error message instead of an ugly stack trace.
* **API Key Defaults:** The system intelligently uses `.get()` fallbacks to handle missing fields (like a missing `position` key for drivers who haven't scored points yet), avoiding silent crashes.
* **Timezone Math:** The `next` and `schedule` modules automatically parse UTC dates from the API and convert them to live local offsets (e.g., `UTC+3`).

---

*Powered by the [Jolpi F1 API](https://jolpi.ca).*
