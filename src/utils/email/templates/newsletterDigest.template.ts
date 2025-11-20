export interface NewsletterDigestParams {
  name?: string;
  subject: string;
  content: string;
}

export const buildNewsletterDigestTemplate = ({
  name,
  subject,
  content
}: NewsletterDigestParams) => {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const html = `
    <h2>${greeting}</h2>
    <p>${content.replace(/\n/g, '<br/>')}</p>
  `;

  const text = `${greeting}\n${content}`;

  return { subject, html, text };
};
