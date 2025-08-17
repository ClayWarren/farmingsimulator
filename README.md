# Farming Simulator

A modern farming simulation game built with TypeScript and Babylon.js.

## Features

- **3D Environment**: Immersive 3D farming environment with realistic terrain
- **Time System**: Dynamic day/night cycle with seasonal progression
- **Weather System**: Dynamic weather that affects gameplay
- **Modern Controls**: WASD movement with mouse look controls
- **Pause System**: ESC key pauses game with resume and restart options
- **Save/Load System**: Complete game state persistence with auto-save and auto-load
- **Audio System**: Procedural ambient sounds, weather audio, and interaction feedback
- **Equipment Shop**: Purchase tools, vehicles, storage, and processing equipment
- **Responsive UI**: Clean interface showing farm status and controls

## Controls

- **WASD** - Move around the farm
- **Mouse** - Look around (click to lock cursor)
- **Shift** - Run faster
- **T** - Till soil (prepare ground for planting)
- **Q** - Switch attachment (when in vehicle)
- **Z** - Debug attachments (development tool)
- **Space** - Interact/Plant/Harvest/Place Buildings/Animals
- **E** - Vehicle interaction
- **1-4** - Select crop types (wheat, corn, potato, carrot)
- **R** - Sell all crops
- **P** - Open equipment shop
- **B** - Toggle building mode
- **L** - Toggle animal mode
- **F** - Feed all animals
- **C** - Collect animal products
- **M** - Toggle Mini-map
- **H** - Toggle headlights (when in vehicle)
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
│   ├── TimeSystem.ts         # Time and season management
│   ├── WeatherSystem.ts      # Weather simulation with crop effects
│   ├── CropSystem.ts         # Crop lifecycle with weather integration
│   ├── EconomySystem.ts      # Market and inventory system
│   ├── VehicleSystem.ts      # Vehicle physics and headlight system
│   ├── EquipmentSystem.ts    # Equipment shop and upgrades
│   ├── BuildingSystem.ts     # Building placement and management
│   ├── FarmExpansionSystem.ts # Land plot purchasing
│   ├── FieldStateSystem.ts   # Visual field state changes
│   ├── LivestockSystem.ts    # Animal management and production
│   ├── AttachmentSystem.ts   # Vehicle attachments and implements
│   └── LightingSystem.ts     # Dynamic lighting and shadows
├── ui/
│   ├── UIManager.ts        # User interface management
│   └── MiniMapSystem.ts    # Real-time mini-map visualization
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
- ✅ **Farm expansion system** with land plot purchasing and building placement
- ✅ **Livestock management** with 4 animal types and full production cycles
- ✅ **Weather effects on crops** with growth and yield modifiers
- ✅ **Field state visualization** with dynamic ground textures showing farming progress
- ✅ **Realistic tilling system** requiring soil preparation before planting
- ✅ **Attachment system** with plow, seeder, and cultivator implements
- ✅ **Auto-save/auto-load** system maintaining progress across browser sessions
- ✅ **Working area effects** for attachments enabling multi-field operations
- ✅ **Dynamic lighting system** with realistic day/night cycle and atmospheric lighting
- ✅ **Mini-map system** with real-time field visualization and vehicle tracking
- ✅ **Vehicle headlights** for safe night driving with automatic and manual control

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

### Weather Effects:

- **Rainy Weather**: +30% faster growth, +20% higher yield
- **Stormy Weather**: -30% slower growth, -20% lower yield
- **Cloudy Weather**: +10% faster growth, +5% higher yield
- **Sunny Weather**: Normal growth and yield rates

## Economic System Details

### **Market Dynamics**:

- **Fluctuating prices**: Market prices change every 5 minutes (300 seconds)
- **Price variation**: ±40% from base prices creates trading opportunities
- **Profit margins**: Buy low, sell high for maximum farm profitability

### **Starting Resources**:

- **Initial money**: $100,000 to begin your farming operation
- **Automatic purchasing**: Seeds bought automatically when planting (if affordable)
- **Inventory tracking**: Real-time display of stored crops and their current values

## Vehicle System Details

### **Farm Vehicles**:

- **Farm Tractor**: Green main farming vehicle for general operations
- **Combine Harvester**: Large red harvesting vehicle with detailed components
- **Controls**: Same WASD keys when inside vehicle
- **Camera**: Dynamic third-person camera with smooth following and mouse look
- **Speed**: Realistic acceleration and deceleration
- **Turning**: Speed-dependent steering for authentic feel

## 🎮 **How to Play**

### **Basic Controls**:

1. **Movement**: Use WASD keys to move around the farm
2. **Look around**: Move mouse to look around (click to lock cursor)
3. **Prepare soil**: Press T to till untilled ground (creates brown furrows)
4. **Select crops**: Press 1-4 to choose wheat, corn, potato, or carrot
5. **Plant crops**: Aim at tilled soil and press Space (auto-buys seeds)
6. **Wait for growth**: Crops progress through 4 growth stages over time
7. **Harvest**: Press Space on fully grown crops to add to inventory
8. **Pause game**: Press ESC to pause and access restart options
9. **Shop access**: Press P to open equipment shop

### **Economic Gameplay**:

10. **Sell crops**: Press R to sell all harvested crops at current market prices
11. **Monitor prices**: Watch for price fluctuations to maximize profits
12. **Manage money**: Ensure sufficient funds for seeds and expansion
13. **Buy equipment**: Visit shop to purchase tools, vehicles, storage, and processing equipment

### **Vehicle Operations**:

14. **Enter vehicles**: Walk near the green tractor or red combine harvester and press E
15. **Drive**: Use WASD to drive vehicles around the farm
16. **Exit vehicle**: Press E again to exit and return to walking

### **Equipment and Upgrades**:

17. **Equipment shop**: Press P to browse and purchase equipment
18. **Tool upgrades**: Buy better hoes for increased tilling, planting, and harvest speed
19. **Vehicle upgrades**: Purchase advanced tractors and harvesters
20. **Attachment upgrades**: Buy plow, seeder, and cultivator attachments for vehicles
21. **Storage expansion**: Buy silos and warehouses for increased capacity
22. **Processing equipment**: Invest in mills and processors for value-added products

### **Farm Expansion**:

22. **Land purchase**: Buy additional land plots to expand your farming operation
23. **Building placement**: Press B to enter building mode and place structures
24. **Building types**: Fences, sheds, silos, and processing facilities

### **Livestock Management**:

25. **Animal mode**: Press L to enter animal placement mode
26. **Animal types**: Purchase chickens, cows, pigs, and sheep
27. **Animal care**: Press F to feed animals and maintain their health
28. **Product collection**: Press C to collect eggs, milk, wool, and meat
29. **Animal economics**: Each animal type has different costs, upkeep, and products

## Equipment Shop Details

### **Tools** (4 items):
- **Basic Hoe**: Starting tool (free)
- **Iron Hoe**: +50% tilling/planting speed, +30% harvest speed, +20% yield ($2,500)
- **Steel Hoe**: +100% tilling/planting speed, +80% harvest speed, +50% yield ($8,000)
- **Watering Can**: +10% crop yield ($1,200)
- **Fertilizer Spreader**: +40% crop yield ($3,500)

### **Vehicles** (2 items):
- **Advanced Tractor**: +80% tilling/planting/harvest speed, +50% fuel efficiency ($15,000)
- **Combine Harvester**: +200% harvest speed, +30% yield ($35,000)

### **Storage** (3 items):
- **Small Silo**: +1,000 storage capacity ($5,000)
- **Large Silo**: +5,000 storage capacity ($12,000)
- **Warehouse**: +15,000 storage + anti-spoilage ($25,000)

### **Processing** (3 items):
- **Grain Mill**: Process wheat into flour ($18,000)
- **Food Processor**: Process vegetables ($22,000)
- **Packaging Plant**: Package goods for maximum value ($45,000)

### **Attachments** (3 items):
- **Heavy Plow**: 2x tilling speed, 3x3 working area, +50% efficiency ($5,000)
- **Precision Seeder**: 2.5x planting speed, 3x3 working area, +80% efficiency ($7,500)
- **Field Cultivator**: 1.5x tilling/planting speed, 2x2 working area, +30% efficiency ($4,000)

## Audio System Details

### **Ambient Sounds**:
- **Wind loops**: Continuous atmospheric background
- **Bird chirps**: Random during daytime (5-15 second intervals)
- **Weather audio**: Rain and storm sounds that change with weather

### **Interaction Sounds**:
- **Tilling**: Soil preparation sound for ground breaking
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
- **Auto-save system**: Automatically saves every 5 minutes during gameplay
- **Auto-load on startup**: Automatically restores previous save when game loads
- **Manual save/load**: Save and load buttons in pause menu for manual control
- **Seamless persistence**: Never lose progress when refreshing browser
- **Version control**: Save format versioning for future compatibility
- **Error handling**: Graceful handling of save/load failures

## Farm Expansion System Details

### **Land Plot Management**:
- **Starter Farmland**: Free starting plot (40x40 units)
- **Northern Meadow**: $15,000 expansion plot (40x40 units)
- **Western Fields**: $25,000 premium expansion plot (40x40 units)
- **Ownership validation**: Can only plant/build on owned land
- **Visual indicators**: "For Sale" signs show available plots with pricing

### **Building System**:
- **Building Types**: Wooden fences, sheds, small/large silos
- **Placement mechanics**: Grid-based snap placement with collision detection
- **Visual preview**: Ghost buildings show placement validity (green/red)
- **Cost integration**: Buildings deduct money on placement
- **Persistence**: All buildings saved and restored with game state

## Livestock System Details

### **Available Animals**:

- **Chickens**: $50 each, $2/day upkeep, produce eggs ($5 each)
- **Cows**: $1,000 each, $15/day upkeep, produce milk ($25 each)
- **Pigs**: $300 each, $8/day upkeep, produce meat ($150 each)
- **Sheep**: $200 each, $5/day upkeep, produce wool ($30 each)

### **Animal Mechanics**:
- **Age progression**: Animals mature over time (10-30 days)
- **Health & happiness**: Affected by feeding schedule and care
- **Production rates**: Mature, healthy animals produce more frequently
- **Visual feedback**: Animals scale with age, opacity shows health
- **Economic cycle**: Daily feeding costs vs. product revenue

### **Animal Management**:
- **Feeding system**: Press F to feed all animals (daily upkeep cost)
- **Product collection**: Press C to collect and sell animal products
- **Automatic aging**: Animals age and mature based on game time
- **Health degradation**: Unfed animals lose health and happiness

## Weather System Integration

### **Crop Growth Effects**:
- **Rain boost**: Rainy weather accelerates crop growth by 30%
- **Storm penalty**: Stormy weather slows crop growth by 30%
- **Cloud benefit**: Cloudy weather provides 10% growth bonus
- **Yield modifiers**: Weather affects final harvest quantities

### **Visual & Audio Integration**:
- **Dynamic sounds**: Rain and storm audio change with weather
- **Real-time effects**: Weather changes impact crops immediately
- **Console feedback**: Detailed logging shows weather bonuses

## Field State System

### **Visual Field States**:
- **Untilled**: Natural grass with scattered vegetation patterns
- **Tilled**: Brown soil with furrow lines showing prepared farmland
- **Planted**: Dark soil with small seed dots indicating fresh planting
- **Growing**: Mixed green/brown showing crops in development
- **Mature**: Bright green vegetation ready for harvest
- **Harvested**: Light green sparse vegetation after crop collection
- **Stubble**: Golden post-harvest remnants that naturally decay

### **Dynamic State Transitions**:
- **Tilling workflow**: Must till soil before planting (T key creates tilled fields)
- **Planting triggers**: Field state automatically updates when crops are planted on tilled soil
- **Growth tracking**: State changes follow crop lifecycle stages
- **Natural decay**: Harvested fields progress through stubble back to grass over 7 days
- **Visual feedback**: Each state has unique procedural textures and colors
- **Save persistence**: Field states are saved and restored with game data

### **Realistic Farming Workflow**:
- **Step 1**: Press T on untilled ground to create brown furrows (tilled state)
- **Step 2**: Press Space on tilled soil to plant seeds (requires tilled ground)
- **Step 3**: Wait for crops to grow through multiple visual stages
- **Step 4**: Press Space on mature crops to harvest and return to harvested state
- **Step 5**: Fields naturally decay: harvested → stubble → untilled over time

### **Attachment Enhanced Workflow**:
- **Vehicle Mode**: Enter tractor (E key) and purchase attachments from shop
- **Attachment Switching**: Press Q to cycle through owned attachments
- **Multi-Field Operations**: Attachments work on 2x2 or 3x3 areas simultaneously
- **Enhanced Efficiency**: Attachments provide speed bonuses and larger working areas
- **Visual Feedback**: Enhanced field state visuals show attachment work patterns

## Dynamic Lighting System

### **Realistic Day/Night Cycle**:
- **Dynamic sun positioning**: Sun moves across sky based on game time
- **Color temperature changes**: Warm sunrise/sunset, cool blue nights
- **Atmospheric lighting**: Sky color transitions throughout the day
- **Shadow system**: Real-time shadows that follow the sun's position

### **Time-Based Lighting Phases**:
- **Sunrise** (5:30-7:00 AM): Warm orange-red transitioning to bright daylight
- **Daytime** (7:00 AM-5:00 PM): Clear bright lighting with realistic shadows
- **Sunset** (5:00-6:30 PM): Golden hour lighting with warm tones
- **Night** (6:30 PM-5:30 AM): Cool blue moonlight with minimal shadows

### **Advanced Shadow Rendering**:
- **PBR integration**: Physically-based rendering with proper shadow casting
- **Performance optimized**: Efficient shadow generation with quality controls
- **Dynamic intensity**: Shadow darkness adjusts with lighting conditions

## Vehicle Headlight System

### **Automatic Headlights**:
- **Smart activation**: Automatically turn on during night hours (6 PM - 6 AM)
- **Vehicle integration**: Only activate when player is driving
- **Real-time detection**: Uses time system for automatic on/off

### **Manual Control**:
- **H key toggle**: Press H to manually turn headlights on/off anytime
- **Override capability**: Manual control works regardless of time of day
- **Console feedback**: Visual confirmation of headlight status

### **Realistic Lighting**:
- **Dual spotlight system**: Left and right headlights per vehicle
- **Warm white illumination**: Realistic automotive lighting color
- **50-unit range**: Lights illuminate farming areas effectively
- **Vehicle-following**: Headlights move and rotate with vehicle direction

### **Technical Features**:
- **SpotLight implementation**: 30° cone angle with proper falloff
- **Parent attachment**: Lights are bound to vehicle for seamless movement
- **Performance conscious**: Lights disabled when not needed

## Mini-Map System

### **Real-Time Farm Overview**:
- **Live field visualization**: Shows field states with color-coded indicators
- **Vehicle tracking**: Real-time position and direction of all vehicles
- **Player location**: Blue dot shows current player position
- **Building display**: All placed structures visible on map

### **Interactive Features**:
- **Zoom controls**: + and - buttons for detailed/overview viewing
- **Toggle visibility**: M key or × button to show/hide mini-map
- **Fixed positioning**: Bottom-right corner positioning
- **Legend system**: Color-coded legend explains all map elements

### **Visual Field States**:
- **Green**: Untilled grass areas
- **Brown**: Tilled soil ready for planting
- **Yellow**: Planted crops growing
- **Bright Green**: Mature crops ready for harvest
- **Blue**: Player position marker
- **Red**: Vehicle positions with direction indicators

### **Performance Optimized**:
- **Canvas-based rendering**: Efficient 2D rendering system
- **Update throttling**: Only redraws when player moves significantly
- **Scalable zoom**: 0.3x to 3.0x zoom range for flexibility

## Roadmap

- [x] ~~Economic system with crop selling and money management~~
- [x] ~~Vehicle mechanics (tractors, harvesters)~~
- [x] ~~Equipment shop and purchasing interface~~
- [x] ~~Save/load game state~~
- [x] ~~Audio system and sound effects~~
- [x] ~~Tool effects on farming efficiency~~
- [x] ~~Farm expansion and building system~~
- [x] ~~Livestock management~~
- [x] ~~Weather effects on crop yields~~
- [x] ~~Field state visualization system~~
- [x] ~~Realistic tilling mechanics~~
- [x] ~~Attachment system with visual implements~~
- [x] ~~Auto-save and auto-load functionality~~
- [x] ~~Working area effects for multi-field operations~~
- [x] ~~Dynamic lighting system with day/night cycle~~
- [x] ~~Mini-map system with real-time visualization~~
- [x] ~~Vehicle headlights for night driving~~
- [ ] Multiplayer farming
- [ ] Advanced farming equipment
- [ ] Seasonal crop varieties
- [ ] Market trading system
- [ ] Achievement system
