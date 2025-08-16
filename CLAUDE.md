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
   - `WeatherSystem` - Dynamic weather with visual effects and crop integration
   - `CropSystem` - Complete crop lifecycle with weather effects (plant, grow, harvest)
   - `EconomySystem` - Market prices, money, inventory management
   - `VehicleSystem` - Driveable tractor with physics and camera switching
   - `EquipmentSystem` - Equipment shop, ownership, and upgrade effects
   - `BuildingSystem` - Building placement, collision detection, and management
   - `FarmExpansionSystem` - Land plot purchasing and ownership validation
   - `LivestockSystem` - Animal management, feeding, and product collection
   - `FieldStateSystem` - Visual field state tracking and procedural textures
3. **InputManager** - Handles player/vehicle controls and interactions
4. **UIManager** - Real-time HUD updates, shop interface, and user interface
5. **SceneManager** - 3D scene setup, terrain, and visual elements
6. **AudioManager** - Procedural sound generation and audio management
7. **SaveManager** - Complete game state persistence and loading

### System Initialization Order

Systems must be initialized in this specific order due to dependencies:

```
SceneManager → AudioManager → TimeSystem → WeatherSystem → EconomySystem → VehicleSystem → EquipmentSystem → FarmExpansionSystem → BuildingSystem → LivestockSystem → CropSystem → FieldStateSystem → InputManager → UIManager
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
- Weather modifiers: Rain (+30% growth, +20% yield), Storms (-30% growth, -20% yield), Cloudy (+10% growth, +5% yield)
- Visual scaling and color changes per growth stage
- Equipment and weather effects combine multiplicatively for final yields

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
- Keyboard shortcuts: 1-4 (crop selection), R (sell all), E (vehicle), P (shop), B (build mode), L (animal mode), F (feed animals), C (collect products), T (till soil), Space (plant/harvest/place), ESC (pause)
- Pause system: ESC key toggles pause state with scene control management
- Shop system: P key opens equipment shop with category navigation
- Building system: B key toggles building mode with ghost preview and collision detection
- Livestock system: L key toggles animal mode, F feeds all animals, C collects products
- Tilling system: T key tills soil for planting, requires tilled ground before crop placement

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

### UI and Styling

- **Tailwind CSS**: Complete utility-first CSS framework for UI components
- **Responsive Design**: Uses Tailwind responsive utilities and viewport units
- **Fullscreen Canvas**: Game canvas fills entire viewport (100vw x 100vh)
- **Overlay UI**: Absolute positioned UI elements with pointer-events control
- **Color Scheme**: Dark theme with transparency and consistent color palette
- **Typography**: System font stack with size utilities from Tailwind

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
- Multiplicative bonuses for tilling speed, planting speed, harvest speed, and crop yield
- Additive bonuses for storage capacity
- Equipment effects stack and combine for optimal efficiency
- Real-time effect calculation and application
- Tilling speed uses planting speed multipliers for equipment bonuses

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
- Field state data: visual field states and state change timestamps

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

## Farm Expansion System

### **Land Plot Management**:
- Three predefined land plots with different pricing and sizes
- Ownership validation for all farming and building activities
- Visual "For Sale" signs with plot information and pricing
- Land purchase integration with economy system

### **Building System Features**:
- Grid-based building placement with 2-unit snapping
- Collision detection prevents overlapping structures
- Ghost building preview with validity indicators (green/red)
- Building catalog with fences, sheds, and storage silos
- Visual integration with SceneManager for 3D model loading
- Fallback to primitive shapes if models fail to load

## Livestock System

### **Animal Management**:
- Four animal types: chicken, cow, pig, sheep with distinct economics
- Age progression system affecting production rates
- Health and happiness metrics affecting animal productivity
- Daily feeding requirements with upkeep costs
- Product collection system (eggs, milk, meat, wool) with market values

### **Economic Integration**:
- Purchase costs: $50 (chicken) to $1,000 (cow)
- Daily upkeep: $2 (chicken) to $15 (cow) per day
- Product values: $5 (eggs) to $150 (meat)
- Automatic product-to-revenue conversion on collection

### **Visual System**:
- Procedural animal representation using basic 3D shapes
- Age-based scaling from 50% to 100% size
- Health-based opacity changes (50% to 100%)
- Instanced mesh system for performance optimization

## Weather Integration

### **Crop Growth Effects**:
- Weather multipliers applied to growth calculations in real-time
- Yield bonuses calculated during harvest combining equipment and weather effects
- Console logging for debugging weather bonus calculations
- Dynamic integration with existing TimeSystem and WeatherSystem

## Field State System

### **Visual Field States**:
- Seven distinct field states: untilled, tilled, planted, growing, mature, harvested, stubble
- Each state has unique procedural textures generated using Canvas 2D context
- Grid-based field positioning matching crop placement system (2-unit spacing)
- Dynamic state transitions based on farming activities and time progression

### **State Management**:
- Real-time field state tracking with Map<string, FieldData> storage
- Position-based field identification using "x_z" key format
- Integration with CropSystem for automatic state updates during crop lifecycle
- Time-based field decay: harvested (2 days) → stubble (5 days) → untilled

### **Visual Implementation**:
- PBR material system with procedural albedo textures
- Field meshes positioned slightly above ground (0.01y offset) to prevent z-fighting
- Efficient mesh disposal and recreation for state changes
- Performance-optimized texture generation using 128x128 Canvas textures

### **Integration Points**:
- Connected to InputManager for tilling, planting, and harvesting state updates
- Integrated with save/load system for field state persistence
- Synchronized with TimeSystem for state change timing
- Updates triggered by crop growth stages in CropSystem update loop
- Tilling validation prevents planting on untilled ground

### **Tilling System Implementation**:
- T key input handling in InputManager for soil preparation
- Tilling timing affected by equipment speed bonuses (reuses planting speed multipliers)
- Can only till untilled or stubble fields (prevents invalid operations)
- Planting now requires tilled fields with helpful error messages
- Enhanced tilled field textures with furrow lines, soil ridges, and clumps

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
- Building types added to BuildingSystem catalog with dimensions and effects
- Land plots configured in FarmExpansionSystem with bounds and pricing
- Animal types added to LivestockSystem with costs, upkeep, and products
- Weather effects customizable via growth and yield multiplier methods
- Field states extended by adding new FieldState types and corresponding texture patterns
