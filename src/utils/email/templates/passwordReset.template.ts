export interface PasswordResetTemplateParams {
  name?: string;
  resetLink: string;
}

export const buildPasswordResetTemplate = ({ name, resetLink }: PasswordResetTemplateParams) => {
  const subject = 'Reset your portfolio account password';
  const greeting = name ? `Hi ${name},` : 'Hi,';

  const html = `
    <h1>${greeting}</h1>
    <p>We received a request to reset your password. You can set a new password by clicking the button below:</p>
    <p><a href="${resetLink}">Reset password</a></p>
    <p>This link is valid for 30 minutes. If you didn't request a password reset, you can ignore this email.</p>
  `;

  const text = `${greeting}
We received a password reset request.
Reset your password using the following link (valid for 30 minutes): ${resetLink}
If you didn't request this, you can ignore this email.`;

  return { subject, html, text };
};
