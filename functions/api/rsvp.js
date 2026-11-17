export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return Response.json(
        { ok: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const data = await request.json();
    const { title, fullName, email, mobile, marketingConsent } = data;

    const allowedTitles = ["Mr", "Ms", "Miss", "Mrs", "Prefer not to say"];

    if (
      typeof title !== "string" ||
      !allowedTitles.includes(title) ||
      typeof fullName !== "string" ||
      !fullName.trim() ||
      fullName.length > 120 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof mobile !== "string" ||
      !mobile.trim() ||
      mobile.length > 30 ||
      typeof marketingConsent !== "boolean"
    ) {
      return Response.json(
        { ok: false, error: "Please check your details." },
        { status: 400 }
      );
    }

    await env.DB.prepare(
      `INSERT INTO shared_rsvps
       (id, title, full_name, email, mobile, marketing_consent)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      title,
      fullName.trim(),
      email.trim(),
      mobile.trim(),
      marketingConsent ? 1 : 0
    ).run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return Response.json(
      { ok: false, error: "Unable to save RSVP. Please try again." },
      { status: 500 }
    );
  }
}
