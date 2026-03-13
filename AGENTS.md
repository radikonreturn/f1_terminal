# AGENTS.md - F1 Terminal CLI

## Project Overview

F1 Terminal CLI is a real-time F1 standings, schedule, and race results terminal application built with React and Ink (React for terminal UI). It uses the Ergast F1 API for data.

## Build, Lint, and Test Commands

### Installation
```bash
cd f1-ink
npm install
```

### Build
```bash
npm run build
```
Builds the project using esbuild, outputting to `dist/index.js`.

### Run
```bash
npm start
# or
npm run start
# or
node dist/index.js
```

### Test
```bash
npm test
```
Currently echoes "No tests yet" and exits 0. No test framework is configured.

### Single Test
Since there are no tests, this is not applicable. When adding tests, use a framework compatible with ESM and JSX (e.g., Vitest or Jest with proper configuration).

## Code Style Guidelines

### General Principles
- This is a JavaScript project (not TypeScript)
- Uses ES Modules (`import`/`export`)
- React functional components with hooks
- JSX for terminal UI components

### Imports
- React imports: `import React, { useState, useEffect } from 'react';`
- Ink imports: `import { render, Box, Text } from 'ink';`
- Third-party: Named imports preferred (e.g., `import SelectInput from 'ink-select-input'`)
- Order: React → Ink → Third-party → Local utilities/config

```javascript
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, Newline, Spacer } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import fetch from 'node-fetch';
```

### Formatting
- 4-space indentation
- JSX attributes on new lines for components with many props
- Use helper functions outside components for reusable logic
- Keep lines under 100 characters when practical

### Naming Conventions
- **Components**: PascalCase (e.g., `StandingsView`, `TableRow`, `AsciiHeader`)
- **Functions/variables**: camelCase (e.g., `apiFetch`, `teamColor`, `isMounted`)
- **Constants**: UPPER_SNAKE_CASE for config (e.g., `BASE`, `CACHE_TTL`)
- **Files**: camelCase or kebab-case (e.g., `index.jsx`)

### Component Structure
```javascript
const ComponentName = ({ prop1, prop2 }) => {
    // Hooks first
    const [state, setState] = useState(initialValue);
    
    // useEffect for side effects
    useEffect(() => {
        // cleanup function
        return () => {};
    }, [dependencies]);
    
    // Event handlers
    const handleEvent = () => {};
    
    // Render
    return (
        <Box>
            <Text>Content</Text>
        </Box>
    );
};
```

### Error Handling
- Use try/catch with async/await for API calls
- Provide meaningful error messages
- Return fallback data when possible (e.g., cached data on network failure)
- Display errors in UI with recovery options (e.g., "Press [R] to retry")

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

### State Management
- Use `useState` for local component state
- Use `useEffect` for data fetching and subscriptions
- Use custom hooks (prefix with `use`) for reusable stateful logic

### Caching
- Use in-memory `Map` for caching API responses
- Define TTL constants for different cache durations
- Mark cached vs. live data in UI

### UI Patterns
- Use `Box` for layout containers
- Use `Text` for text content with color/style props
- Use `useInput` for keyboard input handling
- Support navigation with menu system (arrow keys, enter, escape)

### Performance Considerations
- Keep `useEffect` dependencies minimal
- Use `isMounted` pattern to prevent state updates on unmounted components
- Cache expensive computations when possible

### Keyboard Navigation
- Support standard keys: arrow keys for navigation, enter for selection
- Include escape/menu key to go back
- Include quit key (e.g., 'q') to exit
- Show keyboard hints in footer

### Constants and Configuration
- Define API base URL and season as constants at top of file
- Theme colors, flags, and mappings as static objects
- Use meaningful variable names for magic numbers

### Database/API
- Uses Ergast F1 API: `https://api.jolpi.ca/ergast/f1`
- Current season is 2026 (configurable via `SEASON` constant)

### Adding New Features
1. Create a new view component following the pattern of existing views
2. Add menu item to the `items` array in `App`
3. Add route logic in the main App component
4. Use the `useF1Data` hook for API calls
5. Add keyboard input handling with `useInput`

### Common Issues
- Ink components must render synchronously initially (use loading states)
- Remember to clean up intervals/timeouts in `useEffect` cleanup
- Handle both string and number positions (API returns both types)
