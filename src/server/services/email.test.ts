import { beforeEach, describe, expect, test } from "bun:test";
import {
  type EmailMessage,
  type EmailProvider,
  EmailService,
  getEmailService,
  registerEmailProvider,
  setEmailService,
} from "./email";

class MockEmailProvider implements EmailProvider {
  public sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sentMessages.push(message);
  }

  reset() {
    this.sentMessages = [];
  }
}

describe("Email Service", () => {
  let mockProvider: MockEmailProvider;
  let emailService: EmailService;

  beforeEach(() => {
    mockProvider = new MockEmailProvider();
    emailService = new EmailService(mockProvider);
  });

  describe("EmailService", () => {
    test("sends email with correct structure", async () => {
      const message: EmailMessage = {
        to: { email: "test@example.com", name: "Test User" },
        from: { email: "from@example.com", name: "From User" },
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
        text: "Test text",
      };

      await emailService.send(message);

      expect(mockProvider.sentMessages).toHaveLength(1);
      const sent = mockProvider.sentMessages[0];

      expect(sent.to).toEqual(message.to);
      expect(sent.from).toEqual(message.from);
      expect(sent.subject).toBe("Test Subject");
      expect(sent.html).toBe("<p>Test HTML</p>");
      expect(sent.text).toBe("Test text");
    });

    test("handles recipient without name", async () => {
      const message: EmailMessage = {
        to: { email: "noname@example.com" },
        from: { email: "from@example.com" },
        subject: "Test",
        html: "<p>Test</p>",
      };

      await emailService.send(message);

      const sent = mockProvider.sentMessages[0];
      expect(sent.to.email).toBe("noname@example.com");
      expect(sent.to.name).toBeUndefined();
    });
  });

  describe("getEmailService singleton", () => {
    test("returns same instance on multiple calls", () => {
      const service1 = getEmailService();
      const service2 = getEmailService();
      expect(service1).toBe(service2);
    });

    test("allows setting custom service", () => {
      const customService = new EmailService(mockProvider);
      setEmailService(customService);

      const retrievedService = getEmailService();
      expect(retrievedService).toBe(customService);
    });

    test("uses registered custom provider via EMAIL_PROVIDER", () => {
      setEmailService(null as unknown as EmailService);
      const originalProvider = process.env.EMAIL_PROVIDER;
      process.env.EMAIL_PROVIDER = "custom";

      registerEmailProvider("custom", () => mockProvider);
      const service = getEmailService();
      expect(service).toBeInstanceOf(EmailService);

      process.env.EMAIL_PROVIDER = originalProvider;
      setEmailService(null as unknown as EmailService);
    });

    test("throws for unknown provider", () => {
      setEmailService(null as unknown as EmailService);
      const originalProvider = process.env.EMAIL_PROVIDER;
      process.env.EMAIL_PROVIDER = "nonexistent";

      expect(() => getEmailService()).toThrow(
        'Unknown EMAIL_PROVIDER "nonexistent"',
      );

      process.env.EMAIL_PROVIDER = originalProvider;
      setEmailService(null as unknown as EmailService);
    });
  });
});

describe("ConsoleLogProvider", () => {
  test("console.log provider can be imported and used", async () => {
    const { ConsoleLogProvider } = await import("./email-providers/console");
    const provider = new ConsoleLogProvider();

    const originalLog = console.log;
    const logCalls: string[] = [];
    console.log = (message: string) => {
      logCalls.push(message);
    };

    const message: EmailMessage = {
      to: { email: "test@example.com", name: "Test User" },
      from: { email: "from@example.com", name: "From User" },
      subject: "Test Subject",
      html: "<p>Test HTML</p>",
      text: "Test text",
    };

    await provider.send(message);

    console.log = originalLog;

    expect(logCalls).toHaveLength(1);
    const output = logCalls[0];
    expect(output).toContain("[INFO] [email]");
    expect(output).toContain("EMAIL SEND");
    expect(output).toContain("Test User <test@example.com>");
    expect(output).toContain("From User <from@example.com>");
    expect(output).toContain("Test Subject");
    expect(output).toContain("<p>Test HTML</p>");
    expect(output).toContain("Test text");
  });
});
