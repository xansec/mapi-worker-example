import { Container, getContainer } from "@cloudflare/containers";
import { Hono } from "hono";

export interface Env {
  MAYHEM_URL: string;
  MAYHEM_TOKEN: string;
}

export class MapiContainer extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "5m";
  // Use Cloudflare Worker secrets from the environment
  envVars = {
    MAYHEM_URL: this.env.MAYHEM_URL, // Ensure your worker has this secret set
    MAYHEM_TOKEN: this.env.MAYHEM_TOKEN, // Ensure your worker has this secret set
    // You can add other env vars here as needed
  };

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

function toStringIfFile(val: unknown): string {
    if (typeof val === "string") return val;
    if (val instanceof File) return val.name;
    return "";
  }

app.post("/discover", async (c) => {
  const body = await c.req.parseBody();
  const { api_url } = body;
  if (!api_url) {
    return c.html("<h2>API URL is missing!</h2><a href='/'>Back</a>");
  }

  const container = getContainer(c.env.MAPI_CONTAINER);
  return await container.fetch(c.req.raw, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      api_url: toStringIfFile(api_url),
    }),
  });
});

app.post("/run", async (c) => {
  const body = await c.req.parseBody();
  const { workspace, 
          project, 
          target, 
          api_url, 
          api_spec, 
          duration,
          experimental,
          verify,
          "auth-type": authType,
          "auth-value": authValue } = body;
  if (!workspace || !project || !target || !api_url || !api_spec) {
    return c.html("<h2>Some fields are missing!</h2><a href='/'>Back</a>");
  }

  const container = getContainer(c.env.MAPI_CONTAINER);
  return await container.fetch(c.req.raw, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      workspace: toStringIfFile(workspace),
      project: toStringIfFile(project),
      target: toStringIfFile(target),
      api_url: toStringIfFile(api_url),
      api_spec: toStringIfFile(api_spec),
      duration: toStringIfFile(duration),
      experimental: toStringIfFile(experimental),
      verify: toStringIfFile(verify),
      "auth-type": toStringIfFile(authType),
      "auth-value": toStringIfFile(authValue),
    }),
  });
});

export default app;
