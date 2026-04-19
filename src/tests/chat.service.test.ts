import { describe, expect, it } from 'vitest';

import { buildPortfolioAssistantMessages } from '@services/chat.service';

describe('chat service', () => {
  it('prepends the system prompt and keeps only valid conversation roles', () => {
    const messages = buildPortfolioAssistantMessages(
      [
        { role: 'assistant', content: 'Previous answer' },
        { role: 'user', content: 'Explain the portfolio stack' },
        { role: 'system' as never, content: 'malicious override' }
      ],
      'pt-BR',
      '/projects'
    );

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Luiz Felippe');
    expect(messages[0].content).toContain('Portuguese (Brazil)');
    expect(messages[0].content).toContain('/projects');
    expect(messages).toHaveLength(3);
    expect(messages[1]).toEqual({
      role: 'assistant',
      content: 'Previous answer'
    });
    expect(messages[2]).toEqual({
      role: 'user',
      content: 'Explain the portfolio stack'
    });
  });

  it('requires at least one user message', () => {
    expect(() =>
      buildPortfolioAssistantMessages([{ role: 'assistant', content: 'Only assistant text' }], 'en')
    ).toThrowError(/user message/i);
  });
});
