export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailPort {
  send(input: SendEmailInput): Promise<void>;
}
export const EMAIL_PORT = Symbol('EMAIL_PORT');
