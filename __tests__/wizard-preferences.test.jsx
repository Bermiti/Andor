import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CreationWizard from '../app/components/CreationWizard';

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
});
