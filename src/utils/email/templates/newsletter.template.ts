export interface NewsletterConfirmationParams {
  name?: string;
  confirmationLink: string;
}

export const buildNewsletterConfirmationTemplate = ({
  name,
  confirmationLink
}: NewsletterConfirmationParams) => {
  const subject = 'Confirm your newsletter subscription';
  const salutation = name ? `Hello ${name},` : 'Hello,';

  const html = `
    <h1>${salutation}</h1>
    <p>Thanks for subscribing to the futuristic portfolio newsletter.</p>
    <p>Please confirm your email address by clicking the link below:</p>
    <p><a href="${confirmationLink}">Confirm subscription</a></p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  const text = `${salutation}
Thanks for subscribing to the futuristic portfolio newsletter.
Confirm your email by visiting: ${confirmationLink}
If you did not request this, please ignore this email.`;

  return { subject, html, text };
};
