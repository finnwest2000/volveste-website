export async function onRequestGet({ request, env }) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");

  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const issuer = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
    const JWKS = createRemoteJWKSet(new URL(issuer + "/cdn-cgi/access/certs"));

    await jwtVerify(token, JWKS, {
      issuer,
      audience: env.ACCESS_AUD
    });

    if (!env.DB) {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { results } = await env.DB.prepare(
      `SELECT id, title, full_name, email, mobile,
              marketing_consent, submitted_at
       FROM shared_rsvps
       ORDER BY submitted_at DESC`
    ).all();

    return Response.json({ ok: true, guests: results }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return Response.json({ error: "Access denied or request failed" }, {
      status: 403
    });
  }
}
