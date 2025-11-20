import { sendEmail } from '@utils/email/mailer';
import { buildContactTemplate } from '@utils/email/templates/contact.template';
import { buildNewsletterConfirmationTemplate } from '@utils/email/templates/newsletter.template';
import { buildPasswordResetTemplate } from '@utils/email/templates/passwordReset.template';
import { buildNewsletterDigestTemplate } from '@utils/email/templates/newsletterDigest.template';

interface ContactNotificationOptions {
  adminEmail: string;
  payload: {
    name: string;
    email: string;
    message: string;
    subject?: string;
  };
}

export const sendContactNotificationEmail = async ({ adminEmail, payload }: ContactNotificationOptions) => {
  const template = buildContactTemplate(payload);
  await sendEmail({
    to: adminEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

export const sendNewsletterConfirmationEmail = async (
  email: string,
  payload: { name?: string; confirmationLink: string }
) => {
  const template = buildNewsletterConfirmationTemplate(payload);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  payload: { name?: string; resetLink: string }
) => {
  const template = buildPasswordResetTemplate(payload);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

export const sendNewsletterDigestEmail = async (
  email: string,
  payload: { name?: string; subject: string; content: string }
) => {
  const template = buildNewsletterDigestTemplate(payload);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};
