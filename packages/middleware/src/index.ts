export { init, requirePayment } from "./middleware";
export type { AgentBillConfig, RequirePaymentOptions } from "./types";

// Namespace import: import { agentBill } from "@agent-bill/middleware"
import { init } from "./middleware";
export const agentBill = { init };
