# Farming Simulator

A modern farming simulation game built with TypeScript and Babylon.js.

## Features

- **3D Environment**: Immersive 3D farming environment with realistic terrain
- **Time System**: Dynamic day/night cycle with seasonal progression
- **Weather System**: Dynamic weather that affects gameplay
- **Modern Controls**: WASD movement with mouse look controls
- **Pause System**: ESC key pauses game with resume and restart options
- **Save/Load System**: Complete game state persistence with localStorage
- **Audio System**: Procedural ambient sounds, weather audio, and interaction feedback
- **Equipment Shop**: Purchase tools, vehicles, storage, and processing equipment
- **Responsive UI**: Clean interface showing farm status and controls

## Controls

- **WASD** - Move around the farm
- **Mouse** - Look around (click to lock cursor)
- **Shift** - Run faster
- **Space** - Interact/Plant/Harvest
- **E** - Vehicle interaction
- **1-4** - Select crop types (wheat, corn, potato, carrot)
- **R** - Sell all crops
- **S** - Open equipment shop
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
├── audio/
│   └── AudioManager.ts     # Procedural audio system
├── game/
│   ├── Game.ts             # Main game class
│   ├── SaveManager.ts      # Save/load functionality
│   ├── SceneManager.ts     # 3D scene management
│   └── InputManager.ts     # Input handling
├── systems/
│   ├── TimeSystem.ts       # Time and season management
│   ├── WeatherSystem.ts    # Weather simulation
│   ├── CropSystem.ts       # Crop lifecycle management
│   ├── EconomySystem.ts    # Market and inventory system
│   ├── VehicleSystem.ts    # Vehicle physics and interaction
│   └── EquipmentSystem.ts  # Equipment shop and upgrades
├── ui/
│   └── UIManager.ts        # User interface management
└── main.ts                 # Application entry point
```

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Babylon.js** - 3D game engine
- **Vite** - Fast build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **WebGPU/WebGL** - Hardware-accelerated rendering
- **Tailwind CSS** - UI styling and components

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
- ✅ **Save/load system** with complete game state persistence
- ✅ **Procedural audio system** with ambient sounds, weather audio, and interaction feedback
- ✅ **Equipment shop** with 13 purchasable items across 4 categories

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
8. **Shop access**: Press S to open equipment shop

### **Economic Gameplay**:

9. **Sell crops**: Press R to sell all harvested crops at current market prices
10. **Monitor prices**: Watch for price fluctuations to maximize profits
11. **Manage money**: Ensure sufficient funds for seeds and expansion
12. **Buy equipment**: Visit shop to purchase tools, vehicles, storage, and processing equipment

### **Vehicle Operations**:

13. **Enter tractor**: Walk near the green tractor and press E
14. **Drive**: Use WASD to drive the tractor around the farm
15. **Exit vehicle**: Press E again to exit and return to walking

### **Equipment and Upgrades**:

16. **Equipment shop**: Press S to browse and purchase equipment
17. **Tool upgrades**: Buy better hoes for increased planting speed and yield
18. **Vehicle upgrades**: Purchase advanced tractors and harvesters
19. **Storage expansion**: Buy silos and warehouses for increased capacity
20. **Processing equipment**: Invest in mills and processors for value-added products

## Equipment Shop Details

### **Tools** (4 items):
- **Basic Hoe**: Starting tool (free)
- **Iron Hoe**: +50% planting speed, +30% harvest speed, +20% yield ($2,500)
- **Steel Hoe**: +100% planting speed, +80% harvest speed, +50% yield ($8,000)
- **Watering Can**: +10% crop yield ($1,200)
- **Fertilizer Spreader**: +40% crop yield ($3,500)

### **Vehicles** (2 items):
- **Advanced Tractor**: +80% planting/harvest speed, +50% fuel efficiency ($15,000)
- **Combine Harvester**: +200% harvest speed, +30% yield ($35,000)

### **Storage** (3 items):
- **Small Silo**: +1,000 storage capacity ($5,000)
- **Large Silo**: +5,000 storage capacity ($12,000)
- **Warehouse**: +15,000 storage + anti-spoilage ($25,000)

### **Processing** (3 items):
- **Grain Mill**: Process wheat into flour ($18,000)
- **Food Processor**: Process vegetables ($22,000)
- **Packaging Plant**: Package goods for maximum value ($45,000)

## Audio System Details

### **Ambient Sounds**:
- **Wind loops**: Continuous atmospheric background
- **Bird chirps**: Random during daytime (5-15 second intervals)
- **Weather audio**: Rain and storm sounds that change with weather

### **Interaction Sounds**:
- **Planting**: Soft thud when planting crops
- **Harvesting**: Rustling/cutting sound when collecting crops
- **UI clicks**: Click feedback for all menu buttons
- **Economy**: Coin/bell sounds for buying/selling
- **Vehicles**: Engine start/stop sounds

## Save/Load System Details

### **Persistent Data**:
- **Game progress**: Time, season, day, weather state
- **Economy**: Money, inventory, market prices
- **Farm state**: All planted crops with growth stages and positions
- **Equipment**: Owned tools, vehicles, storage, and processing equipment
- **Player state**: Camera position and rotation
- **Vehicle state**: All vehicle positions and occupancy

### **Save Features**:
- **Automatic persistence**: Saves persist between browser sessions
- **Manual save/load**: Save and load buttons in pause menu
- **Version control**: Save format versioning for future compatibility
- **Error handling**: Graceful handling of save/load failures

## Roadmap

- [x] ~~Economic system with crop selling and money management~~
- [x] ~~Vehicle mechanics (tractors, harvesters)~~
- [x] ~~Equipment shop and purchasing interface~~
- [x] ~~Save/load game state~~
- [x] ~~Audio system and sound effects~~
- [ ] Tool effects on farming efficiency
- [ ] Farm expansion and building system
- [ ] Livestock management
- [ ] Multiplayer farming
- [ ] Advanced farming equipment
- [ ] Weather effects on crop yields
