import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

import CreationExperience from '../app/components/CreationExperience';

function generatedScotlandDraft() {
  const itinerary = {
    destination: { city: 'Escócia', country: 'Reino Unido' },
    trip: { totalDays: 7 },
    days: Array.from({ length: 7 }, (_, index) => ({
      dayNumber: index + 1,
      title: `Dia de teste ${index + 1}`,
      activities: [{ id: `a-${index}`, name: `Atividade de teste ${index + 1}` }],
    })),
  };
  return {
    itinerary,
    persistence: {
      mode: 'local_draft',
      provider: 'browser',
      persisted: false,
      reason: 'auth_required',
    },
  };
}

async function reachPreview() {
  fireEvent.click(screen.getByRole('button', { name: /continuar e ajustar lacunas/i }));
  fireEvent.click(screen.getByText(/fixar base num único alojamento/i));
  fireEvent.click(screen.getByText(/equilibrado \(ritmo ideal\)/i));
  fireEvent.click(screen.getByRole('button', { name: /ver resumo da viagem/i }));
  await screen.findByRole('button', { name: /gerar roteiro personalizado/i });
}

beforeEach(() => {
  localStorage.clear();
  mocks.push.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('persists and opens a guest itinerary using the API response without data.ok', async () => {
  const onItineraryCreated = vi.fn();
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => generatedScotlandDraft(),
  }));
  vi.stubGlobal('fetch', fetchMock);

  render(
    <CreationExperience
      isOpen
      onClose={() => {}}
      initialText="7 dias na Escócia em família com natureza"
      onItineraryCreated={onItineraryCreated}
    />,
  );
  await reachPreview();
  fireEvent.click(screen.getByRole('button', { name: /gerar roteiro personalizado/i }));

  await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
  const [url] = mocks.push.mock.calls[0];
  const tripId = url.split('/').pop();
  expect(localStorage.getItem(`andor_itinerary_${tripId}`)).not.toBeNull();
  expect(onItineraryCreated).toHaveBeenCalledWith(expect.objectContaining({ id: tripId }));

  const request = fetchMock.mock.calls[0][1];
  const body = JSON.parse(request.body);
  expect(body).toMatchObject({
    destination: 'Escócia, Reino Unido',
    days: 7,
    travelers: 4,
    budget: 'moderate',
    style: 'nature',
    pace: 'balanced',
  });
  expect(request.headers['Idempotency-Key'].length).toBeGreaterThanOrEqual(16);
});

test('preserves the form and reuses the idempotency key after a retryable server error', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { code: 'AI_TIMEOUT', message: 'O fornecedor demorou demasiado.', retryable: true } }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => generatedScotlandDraft() });
  vi.stubGlobal('fetch', fetchMock);

  render(
    <CreationExperience
      isOpen
      onClose={() => {}}
      initialText="7 dias na Escócia em família com natureza"
    />,
  );
  await reachPreview();
  fireEvent.click(screen.getByRole('button', { name: /gerar roteiro personalizado/i }));
  expect(await screen.findByText('O fornecedor demorou demasiado.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /gerar roteiro personalizado/i }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key'])
    .toBe(fetchMock.mock.calls[1][1].headers['Idempotency-Key']);
});
