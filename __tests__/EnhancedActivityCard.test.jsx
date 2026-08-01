import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import EnhancedActivityCard from '../app/components/EnhancedActivityCard';

function renderExpanded(activity) {
  return render(
    <EnhancedActivityCard
      activity={{ id: 'activity-1', name: 'Museu local', ...activity }}
      index={0}
      period="morning"
      isExpanded={true}
      onToggle={vi.fn()}
    />
  );
}

describe('EnhancedActivityCard provenance', () => {
  test.each(['nominatim', 'curated'])(
    'limits the %s verification claim to the location and labels other details as estimates',
    (coordinateSource) => {
      renderExpanded({ coordinateSource, description: 'Descrição gerada.' });

      expect(screen.getByText('Localização verificada')).toBeInTheDocument();
      expect(screen.getByText('Detalhes estimados')).toBeInTheDocument();
      expect(screen.queryByText('Dados verificados')).not.toBeInTheDocument();
    }
  );

  test('does not claim a generated location is verified', () => {
    renderExpanded({ coordinateSource: 'ai' });

    expect(screen.queryByText('Localização verificada')).not.toBeInTheDocument();
    expect(screen.getByText('Detalhes estimados')).toBeInTheDocument();
  });

  test('hides unsourced ratings and never inserts a fallback rating', () => {
    renderExpanded({ rating: 4.6 });

    expect(screen.queryByText(/4[.,][56]/)).not.toBeInTheDocument();
  });

  test('hides ratings attributed only to generated or estimated content', () => {
    renderExpanded({ rating: 4.7, ratingSource: 'andor-ai' });

    expect(screen.queryByText(/4[.,]7/)).not.toBeInTheDocument();
  });

  test('shows a rating only when its source is explicit and authoritative', () => {
    renderExpanded({ rating: 4.8, ratingSource: 'google_places' });

    expect(screen.getAllByText('⭐ 4.8 (Google Places)')).toHaveLength(2);
  });

  test('labels activity and transport costs as estimates and does not assume missing costs are free', () => {
    const { rerender } = renderExpanded({
      cost: 12,
      currency: 'JPY',
      transportFromPrevious: { mode: 'Metro', duration: '15 min', cost: 2.5 },
    });

    expect(screen.getAllByText('Custo estimado: JPY 12')).toHaveLength(2);
    expect(screen.getByText('Custo estimado: JPY 2.5')).toBeInTheDocument();

    rerender(
      <EnhancedActivityCard
        activity={{ id: 'activity-2', name: 'Miradouro' }}
        index={1}
        period="afternoon"
        isExpanded={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.queryByText('Grátis')).not.toBeInTheDocument();
  });

  test('omits a numeric cost when its currency is unknown', () => {
    renderExpanded({ cost: 18 });

    expect(screen.queryByText(/Custo estimado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/€18/)).not.toBeInTheDocument();
  });
});
