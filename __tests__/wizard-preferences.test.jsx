import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import CreationWizard, {
  normalizeDestinationSuggestion,
  normalizeDestinationSuggestions,
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
