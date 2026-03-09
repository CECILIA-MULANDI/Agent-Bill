# @agent-bill/middleware

Express middleware for the [x402 V2](https://x402.org) payment protocol. Add a USDC payment wall to any route in two lines.

## Install

```bash
npm install @agent-bill/middleware
```

## Quick Start

```typescript
import express from "express";
import { agentBill, requirePayment } from "@agent-bill/middleware";

const app = express();

// Call once at server start — your wallet address and network
agentBill.init({
  receivingAddress: "0xYourWalletAddress",
  network: "base-sepolia",
});

// Free route
app.get("/api/public", (req, res) => {
  res.json({ message: "Free data" });
});

// Paid route — requirePayment gates it
app.get(
  "/api/weather",
  requirePayment({ amount: "0.01", currency: "USDC", description: "Weather data" }),
  (req, res) => {
    res.json({ city: "New York", temp: "72°F" });
  }
);

app.listen(3000);
```

## API

### `agentBill.init(config)`

Call once when your server starts.

| Field | Type | Description |
|---|---|---|
| `receivingAddress` | `string` | The wallet address that receives USDC payments |
| `network` | `"base-mainnet" \| "base-sepolia"` | The network to accept payments on |

### `requirePayment(options)`

Returns an Express middleware function. Place it before your route handler.

| Field | Type | Description |
|---|---|---|
| `amount` | `string` | Amount in USD, e.g. `"0.01"` |
| `currency` | `"USDC"` | Currency (USDC only for now) |
| `description` | `string` (optional) | Shown in the 402 response |

## How It Works

1. A request arrives with no `PAYMENT-SIGNATURE` header → middleware returns `402` with `PAYMENT-REQUIRED` details (price, address, network)
2. The client signs a payment authorization and retries with the `PAYMENT-SIGNATURE` header
3. The middleware verifies the signature via the [x402 facilitator](https://x402.org/facilitator) and calls `next()` if valid

Verification is handled by `@x402/express` and `@x402/evm` under the hood. AgentBill registers the exact EVM payment scheme (`eip155:*`) automatically.

## Networks

| Config value | Chain |
|---|---|
| `"base-sepolia"` | Base Sepolia testnet (for development) |
| `"base-mainnet"` | Base mainnet (for production) |

## License

MIT
