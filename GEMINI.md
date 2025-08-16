## Project Overview

This is a 3D farming simulator game built with TypeScript and Babylon.js. The game features a 3D environment, a dynamic time and weather system, and a complete save/load system. Players can plant and harvest crops, manage their economy, and purchase equipment to upgrade their farm.

The project is well-structured, with a clear separation of concerns between the game logic, UI, and various game systems. It uses modern tools like Vite for building, ESLint for linting, and Prettier for formatting.

## Building and Running

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

```bash
npm install
```

### Development Server

To run the game in a development environment, use the following command. This will start a local server on port 3000 and automatically open the game in your browser.

```bash
npm run dev
```

### Building for Production

To create a production build of the game, run the following command. The output will be placed in the `dist` directory.

```bash
npm run build
```

### Linting and Type Checking

The project includes scripts for linting and type checking to ensure code quality.

*   **Linting:** `npm run lint`
*   **Type Checking:** `npm run typecheck`
*   **Formatting:** `npm run format`
*   **Check Formatting:** `npm run format:check`

## Development Conventions

*   **Language:** TypeScript
*   **Code Style:** The project uses Prettier for consistent code formatting.
*   **Modularity:** The codebase is organized into modules for different game systems (e.g., `CropSystem`, `EconomySystem`, `WeatherSystem`).
*   **State Management:** Game state is managed within the `Game` class and its associated systems.
*   **UI:** The UI is built with HTML and styled using Tailwind CSS. The `UIManager` class handles the logic for interacting with the DOM.
*   **Save/Load:** The `SaveManager` class handles saving and loading game progress to `localStorage`.
