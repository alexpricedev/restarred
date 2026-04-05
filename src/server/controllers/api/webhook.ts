import type { BunRequest } from "bun";
import { Resend } from "resend";
import { Webhook } from "svix";
import { log } from "../../services/logger";

export const webhookApi = {
  async receive(req: BunRequest): Promise<Response> {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    const forwardTo = process.env.FORWARD_EMAIL_TO;
    const fromEmail = process.env.FROM_EMAIL;

    if (!secret || !forwardTo || !fromEmail) {
      log.error("webhook", "Missing required env vars for webhook forwarding");
      return Response.json({ error: "not configured" }, { status: 500 });
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return Response.json({ error: "missing headers" }, { status: 400 });
    }

    const body = await req.text();

    let event: { type: string; data: { email_id: string; from: string } };
    try {
      const wh = new Webhook(secret);
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      log.warn("webhook", "Invalid webhook signature");
      return Response.json({ error: "invalid signature" }, { status: 401 });
    }

    if (event.type !== "email.received") {
      return Response.json({ received: true });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sender = event.data.from || "unknown";
      const { error } = await resend.emails.receiving.forward({
        emailId: event.data.email_id,
        to: forwardTo,
        from: `${sender} via restarred <${fromEmail}>`,
      });

      if (error) {
        log.error("webhook", `Forward failed: ${error.message}`);
        return Response.json({ error: error.message }, { status: 500 });
      }

      log.info(
        "webhook",
        `Forwarded email ${event.data.email_id} to ${forwardTo}`,
      );
      return Response.json({ forwarded: true });
    } catch (err) {
      log.error("webhook", `Forward error: ${err}`);
      return Response.json({ error: "forward failed" }, { status: 500 });
    }
  },
};
