# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `npm run dev` - Start development server with hot reload at localhost:3000
- `npm run build` - Full TypeScript compilation and Vite production build
- `npm run typecheck` - TypeScript type checking without emit (run before commits)
- `npm run lint` - ESLint checks with modern ESLint 9.x flat config
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without making changes
- `npm run preview` - Preview production build locally

### Dependency Management

- Use `npx npm-check-updates -u && npm install` to update to latest dependencies
- Project uses latest versions: Babylon.js 8.23+, TypeScript 5.9+, Vite 7.1+

## Architecture Overview

### Core Game Architecture

The game follows an **Entity-Component-System (ECS) inspired architecture** with modular systems:

1. **Game.ts** - Central orchestrator that initializes and coordinates all systems
2. **Systems Directory** - Independent systems that handle specific game mechanics:
   - `TimeSystem` - Manages day/night cycles and seasonal progression
   - `WeatherSystem` - Dynamic weather with visual effects
   - `CropSystem` - Complete crop lifecycle (plant, grow, harvest)
   - `EconomySystem` - Market prices, money, inventory management
   - `VehicleSystem` - Driveable tractor with physics and camera switching
3. **InputManager** - Handles player/vehicle controls and interactions
4. **UIManager** - Real-time HUD updates and user interface
5. **SceneManager** - 3D scene setup, terrain, and visual elements

### System Initialization Order

Systems must be initialized in this specific order due to dependencies:

```
SceneManager → TimeSystem → WeatherSystem → EconomySystem → VehicleSystem → CropSystem → InputManager → UIManager
```

### Key Architectural Patterns

**System Communication:**

- Systems communicate through the main Game class
- InputManager uses callbacks to notify UI of state changes
- All systems update in sync during the main game loop
- Pause state managed globally, stopping all system updates when active

**WebGPU/WebGL Handling:**

- Engine automatically detects WebGPU support and falls back to WebGL
- Uses `Engine` base type with WebGPU engine cast for compatibility

**Camera Management:**

- Player camera (FreeCamera) for first-person exploration
- Vehicle camera created dynamically when entering vehicles
- Seamless switching handled by VehicleSystem and InputManager

## Key Technical Details

### Crop System Mechanics

- Grid-based planting system with 2-unit spacing
- Growth stages: 0 (seedling) → 1 (young) → 2 (mature) → 3 (harvestable)
- Time-based growth affected by seasons and weather
- Visual scaling and color changes per growth stage

### Economy System

- Market prices fluctuate every 300 seconds (5 minutes) with ±40% variation
- Automatic seed purchasing when planting (if affordable)
- Inventory stored as Map<CropType, number>
- Real-time UI updates for money, inventory, and market prices

### Vehicle Physics

- Speed-dependent steering for realistic tractor handling
- Momentum-based movement with gradual acceleration/deceleration
- Dynamic camera positioning relative to vehicle orientation
- Enter/exit mechanics with distance-based detection

### Input Handling

- Dual-mode input: walking vs. vehicle controls using same WASD keys
- Pointer lock for mouse look controls
- Ray casting for ground interaction and crop placement
- Keyboard shortcuts: 1-4 (crop selection), R (sell all), E (vehicle), Space (plant/harvest), ESC (pause)
- Pause system: ESC key toggles pause state with scene control management

## Development Guidelines

### TypeScript Configuration

- Strict mode enabled with comprehensive type checking
- Path aliases: `@/*` maps to `src/*`
- Modern ES2022 target with DOM types included

### Code Quality Standards

- Zero TypeScript errors policy - use `npm run typecheck` before commits
- ESLint with TypeScript integration and modern flat config
- Prettier for consistent code formatting - use `npm run format` before commits
- Unused variables/parameters prefixed with `_` if required by architecture

### Performance Considerations

- Instanced meshes for crop rendering efficiency
- Dispose pattern for cleanup (cameras, meshes, materials)
- Delta time-based updates for consistent gameplay across framerates

### Extension Points

- Add new crop types by extending CropType union and cropInfo record
- New systems follow the pattern: constructor → initialize() → update(deltaTime)
- UI elements added to index.html with corresponding UIManager updates
- Vehicle types added via VehicleSystem.createVehicle() pattern
- Game state management: pause/resume functionality with scene control handling
- Restart functionality resets all systems to initial state
