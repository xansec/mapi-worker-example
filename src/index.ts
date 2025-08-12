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
    MAYHEM_URL: "https://app.mayhem.security", // Default URL; change if needed
    MAYHEM_TOKEN: "set your mayhem token here", // Ensure your worker has this secret set
    // MAYHEM_TOKEN: this.env.MAYHEM_TOKEN, // Ensure your worker has this secret set
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

// Simple CLI command builder
app.get("/", (c) => {
  return c.html(`
    <html>
      <head>
        <title>Mayhem API Scan</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            background: #23252D;
            color: #CBD0FF;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background: #454A59;
            padding: 2rem 2.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.3);
            margin-top: 3rem;
            width: 350px;
          }
          h2 {
            text-align: center;
            margin-bottom: 1.5rem;
            font-weight: 600;
            letter-spacing: 1px;
          }
          label {
            display: block;
            margin-bottom: 0.7rem;
            font-size: 1rem;
          }
          input[type="text"], input[type="number"] {
            width: 100%;
            padding: 0.5rem;
            margin-top: 0.2rem;
            border-radius: 6px;
            border: none;
            background: #6A72C7;
            color: #CBD0FF;
            font-size: 1rem;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          }
          button {
            width: 100%;
            padding: 0.7rem;
            background: #5162FF;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 1.1rem;
            font-weight: bold;
            margin-top: 1rem;
            cursor: pointer;
            transition: background 0.2s;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          }
          button:hover {
            background: #5162FF;
          }
          .logo {
            display: block;
            margin: 2rem auto 1rem auto;
            max-width: 180px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <img src="https://cdn.prod.website-files.com/640f25bd69d9b59a5b153b04/67ed8a3a5befb4ebd1fd0ee9_d4fa3576d6225327dffc2e896a15cc3f_logo_blue-p-500.png" alt="Logo" class="logo" />
        <div class="container">
          <h2>Configure Mayhem API Scan</h2>
          <form method="POST" action="/run">
            <label>Workspace: <input type="text" name="workspace" required /></label>
            <label>Project: <input type="text" name="project" required /></label>
            <label>Target: <input type="text" name="target" required /></label>
            <label>API URL: <input type="text" name="api_url" required /></label>
            <label>API Specification: <input type="text" name="api_spec" required /></label>
            <label>Duration: <input type="text" name="duration" value="auto" /></label>
            <details style="margin-top:1.5rem;">
              <summary style="font-weight:500; color:#CBD0FF; cursor:pointer; font-size:1.1rem; margin-bottom:1rem;">
                Additional Options
              </summary>
              <fieldset style="border:1px solid #6A72C7; border-radius:8px; padding:1rem; margin-top:1rem;">
                <label><input type="checkbox" name="experimental" value="1" /> Experimental Rules</label>
                <label><input type="checkbox" name="verify" value="1" /> Verify TLS</label>
                <label for="auth-type">Authentication Header Type:</label>
                <select name="auth-type" id="auth-type" style="width:100%; padding:0.5rem; border-radius:6px; background:#6A72C7; color:#CBD0FF; font-size:1rem;">
                  <option value="None">None</option>
                  <option value="Basic">Basic</option>
                  <option value="Bearer">Bearer</option>
                  <option value="Cookie">Cookie</option>
                </select>
                <label for="auth-value">Authentication Value:</label>
                <input type="password" name="auth-value" id="auth-value" style="width:100%; padding:0.5rem; border-radius:6px; background:#6A72C7; color:#CBD0FF; font-size:1rem;" />
              </fieldset>
            </details>
            <button type="submit">Run</button>
          </form>
        </div>
      </body>
    </html>
  `);
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

  // Ensure all values are strings (not File objects)
  function toStringIfFile(val: unknown): string {
    if (typeof val === "string") return val;
    if (val instanceof File) return val.name;
    return "";
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
