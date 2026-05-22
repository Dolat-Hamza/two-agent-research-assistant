/**
 * Typed env-var access for the frontend.
 *
 * No silent defaults: every required variable must be explicitly set in
 * `.env.local` (copy from `.env.example`). Missing values throw at module
 * load time so misconfiguration is visible immediately instead of producing
 * mystery 404s or cross-origin requests at runtime.
 */

function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing required env var ${name}. Copy frontend/.env.example to ` +
        `frontend/.env.local and fill it in, then restart \`npm run dev\`.`,
    );
  }
  return trimmed;
}

/**
 * SSE endpoint the browser POSTs the planner request to.
 *
 *   - Set to `/api/agent` to use the same-origin proxy (recommended; backend
 *     stays CORS-free).
 *   - Set to `/api/mock-planner` to drive the UI from the in-process mock
 *     when no backend is running.
 *   - Set to an absolute URL (`http://planner.staging…/agent`) only if the
 *     upstream allows CORS from this origin.
 */
export const AGENT_URL: string = requireEnv(
  "NEXT_PUBLIC_AGENT_URL",
  process.env.NEXT_PUBLIC_AGENT_URL,
);
