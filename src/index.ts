import { Container, getContainer } from "@cloudflare/containers";
import { Hono } from "hono";

export interface Env {
  MAYHEM_URL: string;
  MAYHEM_TOKEN: string;
}

export class MapiContainer extends Container<Env> {
  // Port the container listens on (default: 8080)
  defaultPort = 8080;
  // Time before container sleeps due to inactivity (default: 30s)
  sleepAfter = "5m";
  // Environment variables passed to the container
  envVars = {
    // MESSAGE: "I was passed in via the container class!",
    // MAYHEM_URL: "https://app.mayhem.security",
    MAYHEM_TOKEN: "fill in your token here",
  };

  // Optional lifecycle hooks
  override onStart() {
    console.log("Container successfully started");
  }

  override onStop() {
    console.log("Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Container error:", error);
  }
}

// Create Hono app with proper typing for Cloudflare Workers
const app = new Hono<{
  Bindings: Env;
}>();


// Simple CLI command builder
app.get("/", (c) => {
  return c.html(`
    <html>
      <body>
        <h2>Configure Mayhem API Scan</h2>
        <form method="POST" action="/run">
          <label>Workspace: <input type="text" name="workspace" required /></label><br/>
          <label>Project: <input type="text" name="project" required /></label><br/>
          <label>Target: <input type="text" name="target" required /></label><br/>
          <label>API URL: <input type="text" name="api_url" required /></label><br/>
          <label>API Specification: <input type="text" name="api_spec" required /></label><br/>
          <label>Duration: <input type="text" name="duration" default="auto" /></label><br/>
          <button type="submit">Run</button>
        </form>
      </body>
    </html>
  `);
});

app.post("/run", async (c) => {
  const body = await c.req.parseBody();
  const { workspace, project, target, api_url, api_spec, duration } = body;
  if (!workspace || !project || !target || !api_url || !api_spec) {
    return c.html("<h2>All fields are required!</h2><a href='/'>Back</a>");
  }

  const container = getContainer(c.env.MAPI_CONTAINER);
  return await container.fetch(c.req.raw, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      workspace,
      project,
      target,
      api_url,
      api_spec,
      duration,
    }),
  });
});

export default app;
