/**
 * Typed env-var access for the frontend.
 *
 * `NEXT_PUBLIC_AGENT_URL` is the SSE endpoint the browser POSTs to. When unset,
 * we point at the local mock at /api/mock-planner so the UI works without a
 * running Planner Agent. In production / Docker Compose, set this to
 * `/api/agent` and have the API route proxy to `http://planner:8000/agent`.
 */
export const AGENT_URL: string =
  process.env.NEXT_PUBLIC_AGENT_URL?.trim() || "/api/mock-planner";
