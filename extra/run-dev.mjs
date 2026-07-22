#!/usr/bin/env node
/**
 * Starts frontend + backend for local development.
 * Reads ports and paths from `.env` (via dotenv).
 */
import "dotenv/config";
import concurrently from "concurrently";

const frontendPort = process.env.DOCKGE_FRONTEND_PORT || "5002";

const { result } = concurrently(
    [
        {
            command: `wait-on tcp:${frontendPort} && npm run dev:backend`,
            name: "backend",
        },
        {
            command: "npm run dev:frontend",
            name: "frontend",
        },
    ],
    {
        killOthers: [ "failure", "success" ],
        raw: true,
    },
);

result.then(
    () => process.exit(0),
    () => process.exit(1),
);
