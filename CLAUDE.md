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
   - `EquipmentSystem` - Equipment shop, ownership, and upgrade effects
3. **InputManager** - Handles player/vehicle controls and interactions
4. **UIManager** - Real-time HUD updates, shop interface, and user interface
5. **SceneManager** - 3D scene setup, terrain, and visual elements
6. **AudioManager** - Procedural sound generation and audio management
7. **SaveManager** - Complete game state persistence and loading

### System Initialization Order

Systems must be initialized in this specific order due to dependencies:

```
SceneManager → AudioManager → TimeSystem → WeatherSystem → EconomySystem → VehicleSystem → EquipmentSystem → CropSystem → InputManager → UIManager
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
- Keyboard shortcuts: 1-4 (crop selection), R (sell all), E (vehicle), S (shop), Space (plant/harvest), ESC (pause)
- Pause system: ESC key toggles pause state with scene control management
- Shop system: S key opens equipment shop with category navigation

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

## Audio System

### **Procedural Sound Generation**:
- Web Audio API-based system with no external audio files required
- Procedural generation of wind, rain, birds, engine sounds, and UI feedback
- Volume control system with master, ambient, effect, and music channels
- Automatic audio context resumption for browser compatibility

### **Smart Audio Features**:
- Weather-responsive audio that changes with weather system
- Day/night awareness (birds only play during daytime)
- Pause-aware audio that respects game pause state
- Performance optimized with efficient buffer management

## Equipment System

### **Equipment Categories**:
- **Tools**: Hoes, watering cans, fertilizer spreaders with efficiency bonuses
- **Vehicles**: Advanced tractors and harvesters with speed/yield improvements
- **Storage**: Silos and warehouses for increased inventory capacity
- **Processing**: Mills and processors for value-added crop processing

### **Equipment Effects**:
- Multiplicative bonuses for planting speed, harvest speed, and crop yield
- Additive bonuses for storage capacity
- Equipment effects stack and combine for optimal efficiency
- Real-time effect calculation and application

## Save/Load System

### **Comprehensive State Persistence**:
- Time system: current time, season, day, year, time scale
- Economy: money, inventory, market prices, price update timers
- Crops: all planted crops with growth stages and world positions
- Weather: current weather type, temperature, humidity, wind speed
- Vehicles: positions, rotations, speeds, occupancy state
- Equipment: owned tools, vehicles, storage, and processing equipment
- Player: camera position and rotation for seamless restoration

### **Save System Features**:
- LocalStorage-based persistence across browser sessions
- Version control for save format compatibility
- Error handling with graceful fallbacks
- Automatic cleanup and memory management

## Shop System

### **Shop Interface**:
- Category-based navigation (Tools, Vehicles, Storage, Processing)
- Real-time affordability checking with dynamic button states
- Equipment effect visualization with percentage bonuses
- Purchase confirmation with audio feedback

### **Economic Integration**:
- Seamless integration with economy system for purchases
- Real-time money deduction and equipment ownership tracking
- Save system integration for persistent equipment ownership

### Extension Points

- Add new crop types by extending CropType union and cropInfo record
- New systems follow the pattern: constructor → initialize() → update(deltaTime)
- UI elements added to index.html with corresponding UIManager updates
- Vehicle types added via VehicleSystem.createVehicle() pattern
- Game state management: pause/resume functionality with scene control handling
- Restart functionality resets all systems to initial state
- Equipment types added via EquipmentSystem catalog with effects and pricing
- Audio sounds added via AudioManager procedural generation methods
- Save data structure extensible via SaveManager interfaces
