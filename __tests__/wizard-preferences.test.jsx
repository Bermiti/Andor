import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import CreationWizard, {
  normalizeDestinationSuggestion,
  normalizeDestinationSuggestions,
  fingerprintGenerationPayload,
  resolveGeneratedItineraryResponse,
} from '../app/components/CreationWizard';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useToast
vi.mock('../app/components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock AuthContext
vi.mock('../app/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    saveTrip: vi.fn(),
  }),
}));

describe('CreationWizard Personalization Fields', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders step 1 by default when open', () => {
    render(
      <CreationWizard
        isOpen={true}
        onClose={() => {}}
        initialStep={1}
      />
    );
    
    // Check autocomplete input
    expect(screen.getByTestId('wizard-destination-input')).toBeInTheDocument();
  });

  test('does not render if isOpen is false', () => {
    const { container } = render(
      <CreationWizard
        isOpen={false}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('moves focus inside the dialog and closes with Escape', async () => {
    const onClose = vi.fn();
    render(<CreationWizard isOpen={true} onClose={onClose} initialStep={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Fechar Modal' })).toHaveFocus();
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('normalizes a structured Coimbra suggestion without assuming a name field', () => {
    const source = {
      entityId: 'geo-ext-coimbra',
      canonicalName: 'Coimbra',
      displayName: 'Coimbra, Portugal',
      entityType: 'city',
      countryCode: 'PT',
      coordinates: { lat: 40.2033, lng: -8.4103 },
    };

    expect(normalizeDestinationSuggestion(source)).toMatchObject({
      ...source,
      name: 'Coimbra, Portugal',
      cityLabel: 'Coimbra',
      countryLabel: 'Portugal',
    });
    expect(normalizeDestinationSuggestions([null, {}, source])).toHaveLength(1);
  });

  test('renders, selects and preserves the structured Coimbra autocomplete result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{
        entityId: 'geo-ext-coimbra',
        canonicalName: 'Coimbra',
        displayName: 'Coimbra, Portugal',
        entityType: 'city',
        countryCode: 'PT',
        coordinates: { lat: 40.2033, lng: -8.4103 },
        resolutionStatus: 'partially_resolved',
      }],
    })));

    render(<CreationWizard isOpen={true} onClose={() => {}} initialStep={1} />);
    const input = screen.getByTestId('wizard-destination-input');
    fireEvent.change(input, { target: { value: 'Coimbra' } });

    fireEvent.click(await screen.findByText('Coimbra', {}, { timeout: 1500 }));
    expect(input).toHaveValue('Coimbra, Portugal');

    await waitFor(() => {
      const draft = JSON.parse(sessionStorage.getItem('andor_wizard_state') || 'null');
      expect(draft?.destinationEntity).toMatchObject({
        entityId: 'geo-ext-coimbra',
        canonicalName: 'Coimbra',
        coordinates: { lat: 40.2033, lng: -8.4103 },
      });
    }, { timeout: 1500 });
  });

  test('adds, reorders and persists a second destination without losing the first', async () => {
    render(
      <CreationWizard
        isOpen={true}
        onClose={() => {}}
        initialDestination="Lisboa, Portugal"
        initialStep={1}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /adicionar destino/i }));
    const secondDestination = screen.getByTestId('wizard-stage-2-destination');
    fireEvent.change(secondDestination, { target: { value: 'Porto, Portugal' } });
    expect(screen.getByLabelText('Noites na primeira etapa')).toHaveValue(3);
    expect(screen.getByLabelText('Noites na etapa 2')).toHaveValue(1);

    fireEvent.click(screen.getByRole('button', { name: /mover etapa 2 para cima/i }));
    expect(screen.getByTestId('wizard-destination-input')).toHaveValue('Porto, Portugal');
    expect(screen.getByTestId('wizard-stage-2-destination')).toHaveValue('Lisboa, Portugal');

    await waitFor(() => {
      const draft = JSON.parse(sessionStorage.getItem('andor_wizard_state') || 'null');
      expect(draft?.version).toBe(2);
      expect(draft?.journeyStages.map((stage) => stage.destination)).toEqual([
        'Porto, Portugal',
        'Lisboa, Portugal',
      ]);
      expect(draft?.journeyStages.reduce((sum, stage) => sum + stage.nights, 0)).toBe(4);
    }, { timeout: 1500 });
  });

  test('uses a stable client fingerprint for the same generation intent', async () => {
    const first = await fingerprintGenerationPayload({
      journey: { stages: [{ destination: 'Lisboa', nights: 2 }, { destination: 'Porto', nights: 2 }] },
      travelers: 2,
    });
    const retry = await fingerprintGenerationPayload({
      journey: { stages: [{ destination: 'Lisboa', nights: 2 }, { destination: 'Porto', nights: 2 }] },
      travelers: 2,
    });
    const changed = await fingerprintGenerationPayload({
      journey: { stages: [{ destination: 'Lisboa', nights: 2 }, { destination: 'Porto', nights: 2 }] },
      travelers: 3,
    });
    expect(retry).toBe(first);
    expect(changed).not.toBe(first);
  });

  test('uses durable navigation only for persisted results and local storage only for guest drafts', () => {
    const durable = resolveGeneratedItineraryResponse({
      itinerary: { id: 'durable-id', days: [] },
      persistence: { mode: 'durable', persisted: true, provider: 'sqlite', reason: null },
    });
    const guestDraft = resolveGeneratedItineraryResponse({
      itinerary: { days: [] },
      persistence: {
        mode: 'local_draft',
        persisted: false,
        provider: 'browser',
        reason: 'auth_required',
      },
    });

    expect(durable).toMatchObject({ mode: 'durable', id: 'durable-id' });
    expect(guestDraft).toMatchObject({
      mode: 'local_draft',
      id: null,
      itinerary: { persistence: { mode: 'local_draft' } },
    });
    expect(() => resolveGeneratedItineraryResponse({
      itinerary: { days: [] },
      persistence: { persisted: false, reason: 'storage_error' },
    })).toThrow('O roteiro nÃ£o ficou guardado');
  });
});
