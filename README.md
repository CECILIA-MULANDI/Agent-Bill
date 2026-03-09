# Agent-Bill

**The "Stripe" for x402 — make any API payable by an AI agent in one line of code.**

Built on [Base](https://base.org) · Powered by [x402](https://x402.org) · Settles in USDC

---

## The Problem

The internet is shifting from humans clicking buttons to **AI agents calling APIs**. But most APIs still require a credit card, a monthly subscription, or a complex API key setup that an agent can't navigate.

The **x402 protocol** (pioneered by Coinbase) fixes this: a server returns `402 Payment Required` and the agent pays instantly in USDC — no signup, no OAuth, no human in the loop.

**The catch:** implementing x402 from scratch is painful. You have to:
- Handle specific HTTP headers correctly
- Construct and verify EIP-712 signatures
- Integrate with a Facilitator for gasless settlement
- Handle edge cases for failed or partial payments

Most developers won't bother. Agent-Bill makes it trivial.

---

## What is Agent-Bill?

Agent-Bill is a **developer SDK and middleware layer** that abstracts the complexity of x402 so developers can monetize their APIs for AI agents with minimal setup.

```typescript
// Before Agent-Bill: ~200 lines of x402 boilerplate
// After Agent-Bill:

import { requirePayment } from "@agent-bill/middleware";

app.get("/api/data", requirePayment({ amount: "0.05", currency: "USDC" }), (req, res) => {
  res.json({ data: "Your premium data here" });
});
```

That's it. Your API now accepts USDC payments from any AI agent, wallet, or app.

---

## Three Components

### 1. `@agent-bill/middleware` — The Server SDK

Wrap any Express or Next.js API route. Agent-Bill handles the 402 challenge, verifies the payment signature, confirms settlement via the x402 Facilitator, and forwards the request — all before your handler runs.

```typescript
import express from "express";
import { requirePayment, agentBill } from "@agent-bill/middleware";

const app = express();

// Initialize once with your settlement wallet
agentBill.init({
  receivingAddress: "0xYourWalletAddress",
  network: "base-mainnet",
});

// Protect any route
app.get(
  "/api/weather/:city",
  requirePayment({ amount: "0.01", currency: "USDC" }),
  (req, res) => {
    res.json({ city: req.params.city, temp: "72°F" });
  }
);
```

**What it handles for you:**
- Returning the correct `402` response with payment requirements
- Verifying EIP-712 payment signatures
- Confirming settlement with the x402 Facilitator
- Logging payments per API key / wallet address

---

### 2. `@agent-bill/client` — The Agent SDK

Let your AI agent automatically detect and pay x402-protected endpoints. Works with [Coinbase AgentKit](https://github.com/coinbase/agentkit) and any EVM-compatible wallet.

```typescript
import { AgentBillClient } from "@agent-bill/client";
import { CdpAgentKit } from "@coinbase/agentkit";

const wallet = await CdpAgentKit.configureWithWallet({ /* ... */ });
const client = new AgentBillClient({ wallet });

// Drop-in replacement for fetch — auto-handles 402 payments
const response = await client.fetch("https://api.example.com/api/weather/NYC");
const data = await response.json();
// Agent paid $0.01 USDC automatically. No human required.
```

**What it handles for you:**
- Detecting `402 Payment Required` responses
- Parsing payment requirements from headers
- Signing and submitting USDC payments via the agent's wallet
- Retrying the original request after payment confirmation

---

### 3. `@agent-bill/frames` — The Farcaster Pay-Wall Component

A plug-and-play component for [Frog](https://frog.fm) (Farcaster Frames) that lets creators gate content behind a micro-payment — zero backend setup required.

```typescript
import { Frog } from "frog";
import { payWall } from "@agent-bill/frames";

const app = new Frog();

app.frame("/exclusive", payWall({
  amount: "0.10",
  currency: "USDC",
  receivingAddress: "0xYourWallet",
  content: (c) => c.res({
    image: <div>Here is your exclusive content!</div>,
  }),
}));
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        x402 Flow                            │
│                                                             │
│  AI Agent          Agent-Bill          Your API             │
│     │                  │                  │                  │
│     │── GET /data ──────────────────────► │                  │
│     │                  │                  │                  │
│     │◄── 402 Payment Required ────────── │                  │
│     │    X-Payment-Requirements: {...}    │                  │
│     │                  │                  │                  │
│     │── Signs EIP-712 payment ──────────► │                  │
│     │    X-Payment: {signature}           │                  │
│     │                  │                  │                  │
│     │             ┌────▼────┐             │                  │
│     │             │Facilitator│           │                  │
│     │             │(Coinbase) │           │                  │
│     │             └────┬────┘             │                  │
│     │                  │ Confirms USDC    │                  │
│     │                  │ settlement       │                  │
│     │                  └──────────────── ►│                  │
│     │                                     │                  │
│     │◄── 200 OK + data ────────────────── │                  │
└─────────────────────────────────────────────────────────────┘
```

Agent-Bill sits between the agent and your API, implementing the full x402 handshake so you don't have to.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Base wallet address (for receiving USDC)
- A Coinbase Developer Platform account (for the x402 Facilitator)

### Install

```bash
# For API developers (server-side)
npm install @agent-bill/middleware

# For agent developers (client-side)
npm install @agent-bill/client

# For Farcaster frame developers
npm install @agent-bill/frames
```

### Quickstart: Monetize Your First API

```bash
git clone https://github.com/agent-bill/agent-bill
cd agent-bill/examples/express-quickstart
cp .env.example .env
# Fill in your wallet address and CDP API key
npm install && npm start
```

Then test it with the example agent:

```bash
cd examples/agent-client
npm install && npm start
# The agent will automatically pay and fetch the protected endpoint
```

---

## Project Structure

```
agent-bill/
├── packages/
│   ├── middleware/        # @agent-bill/middleware (Express / Next.js)
│   ├── client/            # @agent-bill/client (Agent-side SDK)
│   └── frames/            # @agent-bill/frames (Farcaster / Frog)
├── examples/
│   ├── express-quickstart/ # Basic Express API with payment wall
│   ├── nextjs-api-route/   # Next.js API route example
│   └── agent-client/       # Example AI agent that auto-pays
├── docs/
│   └── architecture.md     # Deep dive on the x402 flow
└── README.md
```

---

## Why Base?

Base has near-zero gas fees, making micro-transactions (e.g. $0.01) economically viable for the first time. On Ethereum mainnet, a $0.05 API call would cost $2 in gas. On Base, it costs fractions of a cent.

Agent-Bill is designed specifically for the **Base ecosystem**:
- Settles in USDC on Base
- Compatible with [Coinbase AgentKit](https://github.com/coinbase/agentkit) out of the box
- Works with the [Coinbase x402 Facilitator](https://x402.org)

---

## Roadmap

- [x] Architecture and SDK design
- [ ] `@agent-bill/middleware` v0.1 — Express middleware
- [ ] `@agent-bill/client` v0.1 — Agent fetch wrapper
- [ ] `@agent-bill/frames` v0.1 — Farcaster pay-wall
- [ ] Dashboard — payment analytics per endpoint
- [ ] Usage-based rate limiting (pay-per-call vs. pay-per-period)
- [ ] Multi-currency support (ETH, cbBTC)
- [ ] TypeScript SDK for Python agents

---

## Contributing

Agent-Bill is in active development. We welcome contributions, bug reports, and feedback.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes
4. Open a PR

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Agent-Bill is not affiliated with Coinbase. x402 is an open protocol. We build on top of it.*
# Agent-Bill
