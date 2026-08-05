// @vitest-environment node

import { describe, expect, test } from 'vitest';

import {
  EMAIL_TEMPLATE_IDS,
  renderTransactionalEmail,
} from '../app/lib/server/transactional-email-templates';

const variablesByTemplate = {
  email_verification: { verificationUrl: 'https://andor.travels/auth/verify?token=test-token' },
  welcome: { plannerUrl: 'https://andor.travels/?wizard=true' },
  password_reset: { recoveryUrl: 'https://andor.travels/auth/reset?token=test-token' },
  trip_created: { destination: 'São Miguel', itineraryUrl: 'https://andor.travels/itinerary/trip-1' },
  group_invitation: {
    inviterName: 'Marta',
    destination: 'Edimburgo',
    invitationUrl: 'https://andor.travels/invitations/token',
  },
  trip_changed: {
    destination: 'Menorca',
    changeSummary: 'A atividade da tarde passou para as 15:00.',
    itineraryUrl: 'https://andor.travels/itinerary/trip-2',
  },
  trip_upcoming: {
    destination: 'Escócia',
    startDate: '12 de setembro de 2026',
    itineraryUrl: 'https://andor.travels/itinerary/trip-3',
  },
  feedback_request: {
    destination: 'Coimbra',
    feedbackUrl: 'https://andor.travels/feedback/trip-4',
    unsubscribeUrl: 'https://andor.travels/preferences/email',
  },
};

describe('transactional email templates', () => {
  test.each(EMAIL_TEMPLATE_IDS)('renders responsive HTML and plain text for %s', (templateId) => {
    const result = renderTransactionalEmail(templateId, variablesByTemplate[templateId]);

    expect(result.subject.length).toBeGreaterThan(5);
    expect(result.preheader.length).toBeGreaterThan(5);
    expect(result.html).toContain('<meta name="viewport"');
    expect(result.html).toContain('ANDOR');
    expect(result.html).toContain('role="presentation"');
    expect(result.text).toContain('https://andor.travels/');
  });

  test('escapes traveler-controlled text', () => {
    const result = renderTransactionalEmail('welcome', {
      firstName: '<img src=x onerror=alert(1)>',
      plannerUrl: 'https://andor.travels/?wizard=true',
    });
    expect(result.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(result.html).not.toContain('<img src=x');
  });

  test('normalizes control characters out of provider-facing subjects', () => {
    const result = renderTransactionalEmail('trip_created', {
      destination: 'Porto\r\nBcc: injected@example.com',
      itineraryUrl: 'https://andor.travels/itinerary/trip-5',
    });
    expect(result.subject).not.toMatch(/[\r\n]/);
    expect(result.subject).toContain('Porto Bcc: injected@example.com');
  });

  test('rejects unsafe action links and missing required fields', () => {
    expect(() => renderTransactionalEmail('password_reset', {
      recoveryUrl: 'javascript:alert(1)',
    })).toThrow('Unsafe email template URL');
    expect(() => renderTransactionalEmail('trip_created', {
      itineraryUrl: 'https://andor.travels/itinerary/1',
    })).toThrow('Missing email template field: destination');
  });
});
