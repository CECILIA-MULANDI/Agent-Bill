/**
 * Request comes in
 *  │
 *  ├── Has PAYMENT-SIGNATURE header? (x402 V2)
 *  │     ├── YES → verify with x402 resource server → call next()
 *  │     └── NO  → return 402 with PAYMENT-REQUIRED requirements
 */
import { Request, Response, NextFunction } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import type { Network } from "@x402/express";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { AgentBillConfig, RequirePaymentOptions } from "./types";

// EIP-155 network ID mapping
const NETWORK_IDS: Record<string, Network> = {
  "base-mainnet": "eip155:8453",
  "base-sepolia": "eip155:84532",
};

// Module-level state — set once via init()
let _config: AgentBillConfig | null = null;
let _server: x402ResourceServer | null = null;

/**
 * Call this once when your server starts.
 * Sets up the x402 V2 resource server with the exact EVM payment scheme.
 */
export function init(config: AgentBillConfig): void {
  _config = config;
  const server = new x402ResourceServer();
  registerExactEvmScheme(server);
  _server = server;
}

/**
 * Express middleware factory. Wraps a route with a real x402 payment wall.
 *
 * Usage:
 *   app.get("/api/data", requirePayment({ amount: "0.01", currency: "USDC" }), handler)
 *
 * Flow:
 *   1. No PAYMENT-SIGNATURE header → 402 with payment requirements
 *   2. PAYMENT-SIGNATURE present → x402 V2 resource server verifies → next()
 */
export function requirePayment(options: RequirePaymentOptions) {
  // Middleware is built once on first request then cached per route
  let _cachedMiddleware:
    | ((req: Request, res: Response, next: NextFunction) => Promise<void>)
    | null = null;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!_config || !_server) {
      throw new Error("AgentBill not initialized. Call agentBill.init() first.");
    }

    if (!_cachedMiddleware) {
      const network = NETWORK_IDS[_config.network];
      if (!network) {
        throw new Error(`Unsupported network: ${_config.network}`);
      }

      const price = `$${options.amount}`;

      const routes = {
        "/*": {
          description:
            options.description ??
            `Payment required: ${options.amount} ${options.currency}`,
          accepts: [
            {
              scheme: "exact",
              payTo: _config.receivingAddress,
              price,
              network,
            },
          ],
        },
      };

      const server = _server;
      _cachedMiddleware = paymentMiddleware(routes, server, undefined, undefined, false);
    }

    const mw = _cachedMiddleware;
    return mw(req, res, next);
  };
}
