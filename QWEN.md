# F1 Terminal CLI - Project Context

## AI Agent Role & Responsibilities

**Role:** Formula 1 data analysis and Python architecture expert

**Project:** f1_terminal (@abdulrad/f1-terminal)

**API:** api.jolpi.ca/ergast/f1 (Jolpica, successor to Ergast)

**Target Season:** 2025

**Implementations:** f1.py (Python CLI) and f1-ink/ (React Ink TUI)

**Rule:** No local caching — always fetch live data

### Responsibilities

1. **Algorithm Design** — Points calculation, ranking, comparison logic
2. **Data Modeling** — How to structure API responses
3. **Edge Case Analysis** — Missing data, cancelled races, DNS/DNF scenarios
4. **Code Review** — Catch logic errors and performance issues
5. **Documentation** — Clear explanations in English

### Working Style

- Think before answering, reason through the problem first
- Explain the logic before writing any code
- Compare alternative approaches and recommend the best one
- When you find a bug, explain why it's a bug, not just what to fix

---

## Project Overview

F1 Terminal CLI is a real-time Formula 1 standings, schedule, and race results application that runs in the terminal. It provides a "pit wall experience" with live driver/constructor standings, race schedules, countdown timers, and pilot statistics. The project uses the [Jolpi API](https://jolpi.ca/) (an Ergast F1 API mirror).

### Dual Implementation

The repository contains **two distinct implementations**:

1. **Python CLI (`f1.py`)**: A lightweight, dependency-free interactive command-line interface using only Python standard library.
2. **React Ink TUI (`f1-ink/`)**: A rich, interactive Terminal User Interface built with React, Ink, and Node.js featuring split-pane layout, caching, and pilot search.

---

## Project Structure

```
f1_terminal/
├── f1.py                    # Python CLI implementation (zero dependencies)
├── f1-ink/                  # React Ink TUI implementation
│   ├── src/index.jsx        # Main React component (all views in single file)
│   ├── dist/index.js        # Built output (esbuild bundle)
│   └── package.json         # Node.js dependencies and scripts
├── Dockerfile               # Docker image for running the TUI
├── docker-compose.yml       # Docker Compose configuration
├── test_stats.py            # Python test utilities
├── README.md                # User-facing documentation
├── AGENTS.md                # Development guidelines for AI agents
└── QWEN.md                  # This file - project context for AI assistants
```

---

## Building and Running

### Python CLI

```bash
# Interactive REPL mode
python f1.py

# Direct command execution
python f1.py standings
python f1.py constructors
python f1.py next
python f1.py pilot VER
```

**Available Commands:**
- `standings` - Driver championship standings
- `constructors` - Constructor championship standings
- `schedule` - Full race calendar
- `next` - Next race with countdown
- `last` - Last race results
- `drivers` - Grid list of all active drivers
- `pilot <CODE>` - Pilot statistics (e.g., `pilot VER`)
- `help` - Show available commands

### React Ink TUI

```bash
cd f1-ink

# Install dependencies
npm install

# Build (esbuild to dist/index.js)
npm run build

# Run
npm start
# or
node dist/index.js
```

**Navigation:**
- `↑/↓` - Navigate menu
- `Enter` - Select option
- `M` or `Escape` - Return to menu
- `Q` - Quit
- `R` - Refresh data in any view

### Docker

```bash
# Run interactive TUI in container
docker compose run --rm f1-terminal
```

### NPM Package

The TUI is published as `f1-terminal-cli`:

```bash
# Run without installation
npx f1-terminal-cli

# Or install globally
npm install -g f1-terminal-cli
f1-terminal-cli
```

---

## API Configuration

- **Base URL**: `https://api.jolpi.ca/ergast/f1`
- **Current Season**: `2025` (configurable via `SEASON` constant)
- **Timeout**: 10 seconds (Python), no explicit timeout (Node.js)

### Caching Note

**Project Rule:** No local caching — always fetch live data.

> Note: The current React Ink implementation has in-memory caching with TTL. This should be removed to comply with the project rule of always fetching live data.

---

## Development Conventions

### Python (`f1.py`)

- **Style**: Pure Python 3, zero third-party dependencies
- **Encoding**: Forces UTF-8 for Windows console compatibility
- **Colors**: ANSI escape codes with `supports_color()` detection
- **Error Handling**: Graceful network failure with user-friendly messages
- **Threading**: Uses background thread for spinner during API fetch

### React Ink (`f1-ink/src/index.jsx`)

- **Language**: JavaScript (ES Modules), not TypeScript
- **Imports Order**: React → Ink → Third-party → Local
- **Indentation**: 4 spaces
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **Line Length**: Keep under 100 characters when practical

### Code Style (React Ink)

```javascript
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import fetch from 'node-fetch';

const ComponentName = ({ prop1, prop2 }) => {
    const [state, setState] = useState(initialValue);

    useEffect(() => {
        return () => {}; // cleanup
    }, [dependencies]);

    return (
        <Box>
            <Text>Content</Text>
        </Box>
    );
};
```

### Error Handling Pattern

```javascript
try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, cached: false };
} catch (err) {
    if (cache.has(url)) {
        return { data: cache.get(url).data, cached: true, offline: true };
    }
    throw new Error(err.message.includes('fetch') ? 'Network Error' : err.message);
}
```

---

## Key Components (React Ink)

### Custom Hooks

- **`useF1Data(endpoint, ttl, dependencies)`**: Handles API fetching with caching, loading states, error handling, and refresh capability

### Views

| Component | Route | Description |
|-----------|-------|-------------|
| `StandingsView` | `standings` | Driver championship table |
| `ConstructorsView` | `constructors` | Constructor standings |
| `ScheduleView` | `schedule` | Race calendar with local times |
| `NextRaceView` | `next` | Live countdown timer |
| `PilotSearchView` | `pilot` | Search by 3-letter code |
| `PilotResults` | (internal) | Display pilot statistics |

### Shared UI Components

- `AsciiHeader` - ASCII art logo
- `Header` - View title with cache/offline indicators
- `Err` - Error message with retry hint
- `Medal` - Position medals (🥇🥈🥉)
- `TableRow` - Fixed-width table row helper

---

## Team Colors (Hex)

```javascript
const TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',  // Blue
    'Ferrari': '#E8002D',           // Red
    'Mercedes': '#27F4D2',          // Cyan
    'McLaren': '#FF8000',           // Orange
    'Aston Martin': '#358C75',      // Green
    'Alpine': '#FF87BC',            // Pink
    'Williams': '#64C4FF',          // Light Blue
    'RB': '#6692FF',                // Blue
    'Haas': '#B6BABD',              // Gray
    'Sauber': '#52E252'             // Green
};
```

---

## Adding New Features

1. **New View Component**: Follow existing pattern (use `useF1Data` hook, handle loading/error states)
2. **Add Menu Item**: Add to `items` array in `App` component
3. **Add Route**: Add conditional render in `App` return statement
4. **Keyboard Input**: Use `useInput` hook for key handling
5. **Update AGENTS.md**: Document any new patterns or conventions

---

## Testing

```bash
# Python
python test_stats.py

# React Ink
npm test  # Currently echoes "No tests yet"
```

No test framework is configured. When adding tests, use a framework compatible with ESM and JSX (e.g., Vitest or Jest with proper configuration).

---

## Common Issues

- **Ink components must render synchronously initially**: Use loading states
- **Cleanup intervals/timeouts**: Always return cleanup function from `useEffect`
- **API position types**: Handle both string and number positions
- **SSL verification**: Python disables SSL verification for Jolpi API compatibility
- **TTY requirements**: Docker requires `stdin_open: true` and `tty: true` for interactive input

---

## Files to Reference

| File | Purpose |
|------|---------|
| `AGENTS.md` | Development guidelines and code style |
| `README.md` | User documentation |
| `f1-ink/src/index.jsx` | Complete React Ink implementation |
| `f1.py` | Complete Python CLI implementation |
| `f1-ink/package.json` | Dependencies and build scripts |
