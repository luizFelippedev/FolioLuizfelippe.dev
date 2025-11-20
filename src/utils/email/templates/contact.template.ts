export interface ContactTemplateParams {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export const buildContactTemplate = ({ name, email, message, subject }: ContactTemplateParams) => {
  const emailSubject = subject ? `New contact: ${subject}` : 'New contact message received';
  const html = `
    <h1>New contact message</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  const text = `Name: ${name}\nEmail: ${email}\n${subject ? `Subject: ${subject}\n` : ''}Message:\n${message}`;

  return { subject: emailSubject, html, text };
};
