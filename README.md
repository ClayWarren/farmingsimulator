# Farming Simulator

A modern farming simulation game built with TypeScript and Babylon.js.

## Features

- **3D Environment**: Immersive 3D farming environment with realistic terrain
- **Time System**: Dynamic day/night cycle with seasonal progression
- **Weather System**: Dynamic weather that affects gameplay
- **Modern Controls**: WASD movement with mouse look controls
- **Pause System**: ESC key pauses game with resume and restart options
- **Responsive UI**: Clean interface showing farm status and controls

## Controls

- **WASD** - Move around the farm
- **Mouse** - Look around (click to lock cursor)
- **Shift** - Run faster
- **Space** - Interact/Plant/Harvest
- **E** - Vehicle interaction
- **1-4** - Select crop types (wheat, corn, potato, carrot)
- **R** - Sell all crops
- **ESC** - Pause game (or release cursor if locked)

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Linting & Type Checking

```bash
npm run lint
npm run typecheck
npm run format
npm run format:check
```

## Project Structure

```
src/
├── game/
│   ├── Game.ts          # Main game class
│   ├── SceneManager.ts  # 3D scene management
│   └── InputManager.ts  # Input handling
├── systems/
│   ├── TimeSystem.ts    # Time and season management
│   └── WeatherSystem.ts # Weather simulation
├── ui/
│   └── UIManager.ts     # User interface management
└── main.ts              # Application entry point
```

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Babylon.js** - 3D game engine
- **Vite** - Fast build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **WebGPU/WebGL** - Hardware-accelerated rendering

## Current Features

- ✅ **Complete crop system** with planting, growing, and harvesting
- ✅ **Dynamic economy system** with buying seeds and selling crops
- ✅ **Market price fluctuations** creating strategic gameplay
- ✅ **Inventory management** with real-time crop storage
- ✅ **Vehicle system** with driveable tractor and dynamic camera switching
- ✅ **Dynamic time system** with day/night cycle and seasons
- ✅ **Weather system** with visual effects and market impact
- ✅ **Interactive 3D environment** with multiple farm fields
- ✅ **Real-time UI** showing farm status, money, inventory, and crop information
- ✅ **Multiple crop types** (wheat, corn, potato, carrot) with different economics
- ✅ **First-person and vehicle controls** with seamless transitions
- ✅ **Pause system** with ESC key, restart functionality, and styled pause menu

## Crop System Details

### Available Crops:

- **Wheat**: 5 days growth, $2 seed cost, $8 sell price
- **Corn**: 7 days growth, $3 seed cost, $12 sell price
- **Potato**: 6 days growth, $4 seed cost, $10 sell price
- **Carrot**: 4 days growth, $1 seed cost, $6 sell price

### Growth Stages:

1. **Seedling** (0-25% growth)
2. **Young Plant** (25-50% growth)
3. **Mature Plant** (50-75% growth)
4. **Ready for Harvest** (75-100% growth)

## Economic System Details

### **Market Dynamics**:

- **Fluctuating prices**: Market prices change every 5 minutes (300 seconds)
- **Price variation**: ±40% from base prices creates trading opportunities
- **Profit margins**: Buy low, sell high for maximum farm profitability

### **Starting Resources**:

- **Initial money**: $10,000 to begin your farming operation
- **Automatic purchasing**: Seeds bought automatically when planting (if affordable)
- **Inventory tracking**: Real-time display of stored crops and their current values

## Vehicle System Details

### **Farm Tractor**:

- **Location**: Spawns near the farm fields
- **Controls**: Same WASD keys when inside vehicle
- **Camera**: Dynamic third-person camera with smooth following
- **Speed**: Realistic acceleration and deceleration
- **Turning**: Speed-dependent steering for authentic feel

## 🎮 **How to Play**

### **Basic Controls**:

1. **Movement**: Use WASD keys to move around the farm
2. **Look around**: Move mouse to look around (click to lock cursor)
3. **Select crops**: Press 1-4 to choose wheat, corn, potato, or carrot
4. **Plant crops**: Aim at empty field areas and press Space (auto-buys seeds)
5. **Wait for growth**: Crops progress through 4 growth stages over time
6. **Harvest**: Press Space on fully grown crops to add to inventory
7. **Pause game**: Press ESC to pause and access restart options

### **Economic Gameplay**:

7. **Sell crops**: Press R to sell all harvested crops at current market prices
8. **Monitor prices**: Watch for price fluctuations to maximize profits
9. **Manage money**: Ensure sufficient funds for seeds and expansion

### **Vehicle Operations**:

10. **Enter tractor**: Walk near the green tractor and press E
11. **Drive**: Use WASD to drive the tractor around the farm
12. **Exit vehicle**: Press E again to exit and return to walking

## Roadmap

- [x] ~~Economic system with crop selling and money management~~
- [x] ~~Vehicle mechanics (tractors, harvesters)~~
- [ ] Equipment shop and purchasing interface
- [ ] Farm expansion and building system
- [ ] Livestock management
- [ ] Save/load game state
- [ ] Audio system and sound effects
- [ ] Multiplayer farming
- [ ] Advanced farming equipment
- [ ] Weather effects on crop yields
