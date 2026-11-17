
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return Response.json(
        { ok: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const data = await request.json();
    const { title, fullName, email, mobile, marketingConsent } = data;

    if (
      !title || !fullName || !email || !mobile ||
      typeof marketingConsent !== "boolean"
    ) {
      return Response.json(
        { ok: false, error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    const allowedTitles = [
      "Mr", "Ms", "Miss", "Mrs", "Prefer not to say"
    ];

    if (
      !allowedTitles.includes(title) ||
      fullName.length > 120 ||
      email.length > 254 ||
      mobile.length > 30 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { ok: false, error: "Please check your details." },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      INSERT INTO rsvps
      (title, full_name, email, mobile, marketing_consent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      title,
      fullName,
      email,
      mobile,
      marketingConsent ? 1 : 0
    ).run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("RSVP submission failed:", error);
    return Response.json(
      { ok: false, error: "Unable to save RSVP. Please try again." },
      { status: 500 }
    );
  }
}
