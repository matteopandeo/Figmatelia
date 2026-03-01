import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper: get authenticated user from Authorization header
async function getAuthUser(authHeader: string | null): Promise<{ id: string; email?: string; name?: string } | null> {
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
    };
  } catch (err) {
    console.log("Auth error while verifying user token:", err);
    return null;
  }
}

// Helper: generate a URL-safe slug
function generateSlug(name?: string, email?: string): string {
  const base = name || email?.split("@")[0] || "collector";
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${clean}-${suffix}`;
}

// Health check endpoint
app.get("/make-server-758b50b2/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── STAMPS ───────────────────────────────────────────────

// GET /stamps — get all stamps for the authenticated user
app.get("/make-server-758b50b2/stamps", async (c) => {
  const user = await getAuthUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Unauthorized: could not verify user session while fetching stamps" }, 401);
  }

  try {
    const stamps = await kv.get(`stamps:${user.id}`);
    return c.json({ stamps: stamps || [] });
  } catch (err) {
    console.log("Error fetching stamps for user:", user.id, err);
    return c.json({ error: `Failed to fetch stamps: ${err}` }, 500);
  }
});

// POST /stamps — save stamps for the authenticated user (replaces all stamps)
app.post("/make-server-758b50b2/stamps", async (c) => {
  const user = await getAuthUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Unauthorized: could not verify user session while saving stamps" }, 401);
  }

  try {
    const body = await c.req.json();
    const stamps = body.stamps;
    if (!Array.isArray(stamps)) {
      return c.json({ error: "Invalid request body: stamps must be an array" }, 400);
    }

    await kv.set(`stamps:${user.id}`, stamps);
    return c.json({ success: true, count: stamps.length });
  } catch (err) {
    console.log("Error saving stamps for user:", user.id, err);
    return c.json({ error: `Failed to save stamps: ${err}` }, 500);
  }
});

// POST /stamps/add — add a single stamp for the authenticated user
app.post("/make-server-758b50b2/stamps/add", async (c) => {
  const user = await getAuthUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Unauthorized: could not verify user session while adding stamp" }, 401);
  }

  try {
    const body = await c.req.json();
    const stamp = body.stamp;
    if (!stamp || !stamp.id) {
      return c.json({ error: "Invalid request body: stamp must have an id" }, 400);
    }

    const existing = (await kv.get(`stamps:${user.id}`)) || [];
    existing.unshift(stamp);
    await kv.set(`stamps:${user.id}`, existing);
    return c.json({ success: true });
  } catch (err) {
    console.log("Error adding stamp for user:", user.id, err);
    return c.json({ error: `Failed to add stamp: ${err}` }, 500);
  }
});

// ─── STAMPBOOK ────────────────────────────────────────────

// POST /stampbook/ensure — creates a stampbook with slug if none exists, returns it
app.post("/make-server-758b50b2/stampbook/ensure", async (c) => {
  const user = await getAuthUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Unauthorized: could not verify user session while ensuring stampbook" }, 401);
  }

  try {
    // Check if user already has a stampbook
    let stampbook = await kv.get(`stampbook:${user.id}`);
    if (stampbook) {
      return c.json({ stampbook });
    }

    // Create new stampbook with generated slug
    const slug = generateSlug(user.name, user.email);
    const displayName = user.name || user.email?.split("@")[0] || "Collector";

    stampbook = {
      userId: user.id,
      slug,
      title: "My Figmatelia",
      displayName,
      createdAt: new Date().toISOString(),
    };

    // Store both the user→stampbook and slug→stampbook mappings
    await kv.set(`stampbook:${user.id}`, stampbook);
    await kv.set(`stampbook-by-slug:${slug}`, stampbook);

    return c.json({ stampbook });
  } catch (err) {
    console.log("Error ensuring stampbook for user:", user.id, err);
    return c.json({ error: `Failed to create stampbook: ${err}` }, 500);
  }
});

// GET /stampbook/me — get current user's stampbook
app.get("/make-server-758b50b2/stampbook/me", async (c) => {
  const user = await getAuthUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Unauthorized: could not verify user session while fetching stampbook" }, 401);
  }

  try {
    const stampbook = await kv.get(`stampbook:${user.id}`);
    return c.json({ stampbook: stampbook || null });
  } catch (err) {
    console.log("Error fetching stampbook for user:", user.id, err);
    return c.json({ error: `Failed to fetch stampbook: ${err}` }, 500);
  }
});

// GET /stampbook/public/:slug — public endpoint, no auth required
app.get("/make-server-758b50b2/stampbook/public/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!slug) {
    return c.json({ error: "Missing slug parameter" }, 400);
  }

  try {
    const stampbook = await kv.get(`stampbook-by-slug:${slug}`);
    if (!stampbook) {
      return c.json({ error: "Stampbook not found" }, 404);
    }

    const stamps = (await kv.get(`stamps:${stampbook.userId}`)) || [];

    return c.json({
      stampbook: {
        slug: stampbook.slug,
        title: stampbook.title,
        displayName: stampbook.displayName,
        createdAt: stampbook.createdAt,
      },
      stamps,
    });
  } catch (err) {
    console.log("Error fetching public stampbook by slug:", slug, err);
    return c.json({ error: `Failed to fetch public stampbook: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
