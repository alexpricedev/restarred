import { afterEach, describe, expect, mock, test } from "bun:test";

const mockForward = mock(() =>
  Promise.resolve({ data: { id: "fwd-123" }, error: null }),
);

mock.module("resend", () => ({
  Resend: class {
    emails = {
      receiving: {
        forward: mockForward,
      },
    };
  },
}));

const mockVerify = mock(
  (body: string) => JSON.parse(body) as Record<string, unknown>,
);

mock.module("svix", () => ({
  Webhook: class {
    verify = mockVerify;
  },
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { webhookApi } from "./webhook";

const VALID_HEADERS = {
  "svix-id": "msg_123",
  "svix-timestamp": "1234567890",
  "svix-signature": "v1,signature",
  "content-type": "application/json",
};

const emailReceivedEvent = JSON.stringify({
  type: "email.received",
  data: { email_id: "em_123", from: "sender@example.com" },
});

describe("Webhook API", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.RESEND_WEBHOOK_SECRET = originalEnv.RESEND_WEBHOOK_SECRET;
    process.env.FORWARD_EMAIL_TO = originalEnv.FORWARD_EMAIL_TO;
    process.env.FROM_EMAIL = originalEnv.FROM_EMAIL;
    process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY;
    mockForward.mockClear();
    mockVerify.mockClear();
  });

  function setEnv() {
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
    process.env.FORWARD_EMAIL_TO = "me@example.com";
    process.env.FROM_EMAIL = "digest@restarred.dev";
    process.env.RESEND_API_KEY = "re_test";
  }

  test("returns 500 when env vars are missing", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.FORWARD_EMAIL_TO;

    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body: emailReceivedEvent,
        headers: VALID_HEADERS,
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("not configured");
  });

  test("returns 400 when svix headers are missing", async () => {
    setEnv();

    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body: emailReceivedEvent,
        headers: { "content-type": "application/json" },
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(400);
  });

  test("returns 401 when signature verification fails", async () => {
    setEnv();
    mockVerify.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });

    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body: emailReceivedEvent,
        headers: VALID_HEADERS,
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(401);
  });

  test("ignores non email.received events", async () => {
    setEnv();

    const body = JSON.stringify({ type: "email.sent", data: {} });
    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body,
        headers: VALID_HEADERS,
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
    expect(mockForward).not.toHaveBeenCalled();
  });

  test("forwards email.received events", async () => {
    setEnv();

    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body: emailReceivedEvent,
        headers: VALID_HEADERS,
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.forwarded).toBe(true);
    expect(mockForward).toHaveBeenCalledWith({
      emailId: "em_123",
      to: "me@example.com",
      from: "sender@example.com via restarred <digest@restarred.dev>",
    });
  });

  test("returns 500 when forward fails", async () => {
    setEnv();
    mockForward.mockResolvedValueOnce({
      data: null as unknown,
      error: { message: "forward failed", name: "api_error" } as unknown,
    } as Awaited<ReturnType<typeof mockForward>>);

    const request = createBunRequest(
      "http://localhost:3000/api/webhooks/resend",
      {
        method: "POST",
        body: emailReceivedEvent,
        headers: VALID_HEADERS,
      },
    );
    const response = await webhookApi.receive(request);

    expect(response.status).toBe(500);
  });
});
