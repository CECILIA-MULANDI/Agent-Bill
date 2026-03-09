import { x402ResourceServer } from "@x402/express";
import type { Network } from "@x402/express";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import type { AgentBillConfig } from "./types";

// EIP-155 CAIP-2 network ID mapping
export const NETWORK_IDS: Record<string, Network> = {
  "base-mainnet": "eip155:8453",
  "base-sepolia": "eip155:84532",
};

// Module-level singleton — set once via init()
let _config: AgentBillConfig | null = null;
let _server: x402ResourceServer | null = null;

/**
 * Call once at server start. Configures the x402 V2 resource server with the
 * exact EVM payment scheme. Works for both Express and Next.js adapters.
 */
export function init(config: AgentBillConfig): void {
  _config = config;
  const server = new x402ResourceServer();
  registerExactEvmScheme(server);
  _server = server;
}

/**
 * Returns the initialised config and server, or throws if init() hasn't been
 * called yet.
 */
export function getState(): { config: AgentBillConfig; server: x402ResourceServer } {
  if (!_config || !_server) {
    throw new Error("AgentBill not initialized. Call agentBill.init() first.");
  }
  return { config: _config, server: _server };
}
