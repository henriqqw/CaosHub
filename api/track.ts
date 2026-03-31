import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANALYTICS_ENDPOINT = "http://74.234.32.215/api/v1/events";
const WRITE_KEY = process.env.ANALYTICS_WRITE_KEY ?? "";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Key": WRITE_KEY,
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).send(text);
    }

    return res.status(202).end();
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach analytics endpoint" });
  }
}
