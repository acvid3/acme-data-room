export const EMAIL_SERVICE = 'EMAIL_SERVICE';

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
}

export interface EmailService {
    send(message: EmailMessage): Promise<boolean>;
}
