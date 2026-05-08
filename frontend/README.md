# SegrePay Frontend

A modern, eco-friendly React + TypeScript + Tailwind CSS frontend for the SegrePay tokenized waste segregation rewards platform.

## Project Overview

**SegrePay** is a blockchain-based waste segregation rewards system built on Avalanche Fuji Testnet. Citizens earn ECO tokens by depositing properly segregated waste at MRFs (Material Recovery Facilities), verified by authorized EcoVerifiers.

### Key Features

1. **🪙 ECO Token on Avalanche** - ERC-20 token rewards for waste segregation
2. **✓ EcoVerifier Panel** - Form for verifiers to submit waste deposits
3. **👤 Citizen Dashboard** - View ECO balance and deposit history
4. **🏆 Barangay Leaderboard** - Real-time rankings of all 17 Olongapo barangays

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Ethers.js v6 | Blockchain interaction |
| Zustand | State management |
| Recharts | Data visualization |
| qrcode.react | QR code generation |

## Project Structure

```
frontend/
├── public/                  # Static assets
│   └── logo.svg
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Layout.tsx        # Main app shell
│   │   ├── WalletButton.tsx  # Wallet connection
│   │   ├── TabNavigation.tsx # Tab switching
│   │   └── NotificationContainer.tsx
│   ├── contracts/            # Smart contract ABIs
│   │   └── abis.ts
│   ├── hooks/                # Custom React hooks
│   │   └── useWallet.ts
│   ├── pages/                # Page components
│   │   ├── VerifierPanel.tsx
│   │   ├── CitizenDashboard.tsx
│   │   └── Leaderboard.tsx
│   ├── services/             # API & contract services
│   │   └── contracts.ts
│   ├── stores/               # Zustand state management
│   │   ├── walletStore.ts
│   │   └── appStore.ts
│   ├── types/                # TypeScript definitions
│   │   └── index.ts
│   ├── utils/                # Helper functions
│   │   └── demoData.ts
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind CSS entry
├── .env.example              # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Core Wallet or MetaMask browser extension

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Connect to Avalanche Fuji Testnet

1. Install Core Wallet or MetaMask
2. Add Fuji Testnet manually:
   - Network Name: Avalanche Fuji Testnet
   - RPC URL: https://api.avax-test.network/ext/bc/C/rpc
   - Chain ID: 43113
   - Currency Symbol: AVAX
   - Block Explorer: https://testnet.snowtrace.io

3. Get test AVAX from the [Faucet](https://faucet.avax.network)

### Smart Contract Configuration

After deploying the smart contracts, update `.env` with the contract addresses:

```env
VITE_SEGRE_TOKEN_ADDRESS=0xYourSegreTokenAddress
VITE_SEG_REWARDS_ADDRESS=0xYourSegRewardsAddress
VITE_USE_MOCK_DATA=false
```

## Smart Contract Integration

### Contract Addresses (Fuji Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| SegreToken | TBD | ERC-20 ECO token |
| SegRewards | TBD | Deposit & reward logic |

### API Methods

All blockchain interactions are abstracted as API methods in `@/services/contracts.ts`:

```typescript
// Token API
await getTokenBalance(address)           // GET /token/balance/:address
await getTokenDecimals()                 // GET /token/decimals
await getTokenSymbol()                   // GET /token/symbol

// Deposit API
await submitDeposit(citizen, barangayId, category, kg)  // POST /deposits
await getCitizenDeposits(address)        // GET /citizen/:address/deposits
await getTotalKgDeposited(address)       // GET /citizen/:address/kg

// Leaderboard API
await getBarangayTotals(ids)             // GET /barangay/totals
await getFullLeaderboard()               // GET /leaderboard

// Verifier API
await isVerifier(address)                // GET /verifier/:address/status

// Real-time Events
subscribeToDeposits(callback)            // WebSocket: DepositLogged events
```

## User Flows

### Citizen Flow
1. Connect wallet (Core Wallet or MetaMask)
2. View ECO token balance (auto-refreshes every 15s)
3. See deposit history from blockchain events
4. Track personal waste segregation stats

### EcoVerifier Flow
1. Connect authorized verifier wallet
2. Select household from demo list or scan QR code
3. Enter waste category and weight
4. Submit deposit → triggers smart contract minting
5. Citizen receives ECO tokens automatically

### Leaderboard Flow
1. View real-time barangay rankings
2. Toggle between table and chart views
3. See live activity feed of recent deposits
4. Watch rankings update as new deposits come in

## Development Features

### Mock Data Mode
Set `VITE_USE_MOCK_DATA=true` in `.env` to develop without deployed contracts:
- Simulated ECO token balances
- Mock deposit history
- Fake barangay rankings
- Demo verifier authorization

### Hot Reload
Vite provides instant hot module replacement for rapid development.

### Type Safety
Full TypeScript coverage with strict mode enabled.

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory, ready for deployment to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Troubleshooting

### Wallet Not Detected
- Ensure Core Wallet or MetaMask is installed
- Check if you're on the correct browser
- Try refreshing the page

### Wrong Network Error
- Click "Wrong Network" badge to auto-switch to Fuji
- Or manually add Fuji Testnet in wallet settings

### Transaction Failed
- Check that you have test AVAX from the faucet
- Verify contract addresses are correct in `.env`
- Ensure you're connected as an authorized verifier (for deposits)

## Design System

### Colors
- **Primary Green**: `#2d6a4f` - Main brand color
- **Light Green**: `#52b788` - Accents
- **Background**: `#f5f2eb` - Warm off-white
- **Card**: `#fff9ef` - Card backgrounds
- **Ink**: `#1a1a12` - Primary text

### Typography
- **Headings**: Instrument Serif (elegant, editorial)
- **Body**: Outfit (modern, clean)
- **Code**: Geist Mono (technical)

## License

MIT License - Built for TECHFEST Hackathon Olongapo

## Team

- Blockchain Dev: Smart contracts & deployment
- Frontend Dev: React app & UI/UX
- Project Lead: Demo preparation & presentation

---

**Powered by Avalanche Fuji Testnet** 🏔️♻️
