export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress;
  from: EmailAddress;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export class EmailService {
  constructor(private provider: EmailProvider) {}

  async send(message: EmailMessage): Promise<void> {
    await this.provider.send(message);
  }
}

let emailServiceInstance: EmailService | null = null;

const providerFactories: Record<string, () => EmailProvider> = {
  console: () => {
    const { ConsoleLogProvider } =
      require("./email-providers/console") as typeof import("./email-providers/console");
    return new ConsoleLogProvider();
  },
};

export function registerEmailProvider(
  name: string,
  factory: () => EmailProvider,
): void {
  providerFactories[name] = factory;
}

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    const providerName = process.env.EMAIL_PROVIDER || "console";
    const factory = providerFactories[providerName];

    if (!factory) {
      throw new Error(
        `Unknown EMAIL_PROVIDER "${providerName}". ` +
          "Register it with registerEmailProvider() before calling getEmailService().",
      );
    }

    emailServiceInstance = new EmailService(factory());
  }
  return emailServiceInstance;
};

export const setEmailService = (service: EmailService): void => {
  emailServiceInstance = service;
};
