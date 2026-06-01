import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi, describe } from 'vitest';
import NotFound from '../app/not-found';
import ErrorComponent from '../app/error';

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
    }),
    useParams: () => ({}),
  };
});

// Mock CSS Module for not-found.js
vi.mock('../app/not-found.module.css', () => {
  return {
    default: new Proxy(
      {},
      {
        get: (target, prop) => prop,
      }
    ),
  };
});

describe('Not Found Page (404)', () => {
  test('renders without crashing and contains links', () => {
    render(<NotFound />);
    
    // Check that standard text is rendered
    expect(screen.getByText('Acontece até aos melhores exploradores.')).toBeInTheDocument();
    
    // Check home link
    const homeLink = screen.getByText('← Voltar ao início');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
    
    // Check discovery link
    const wizardLink = screen.getByText('Descobrir destinos');
    expect(wizardLink).toBeInTheDocument();
    expect(wizardLink.getAttribute('href')).toBe('/?wizard=true');
  });

  test('ask Andor button exists and dispatches window event', async () => {
    render(<NotFound />);
    
    const askButton = screen.getByText('Ou pergunta ao Andor →');
    expect(askButton).toBeInTheDocument();

    const eventPromise = new Promise((resolve) => {
      window.addEventListener('open-ai-chat', resolve, { once: true });
    });

    await userEvent.click(askButton);
    await eventPromise; // Assert that event is dispatched
  });
});

describe('Error Page (500 / Error Boundary)', () => {
  test('renders with error message and buttons', () => {
    const errorObj = new Error('Test error message');
    const mockReset = vi.fn();

    render(<ErrorComponent error={errorObj} reset={mockReset} />);

    // Check title
    expect(screen.getByText('Ups! Algo correu mal.')).toBeInTheDocument();
    
    // Check button to retry
    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();

    // Check link to return home
    const homeLink = screen.getByText('Voltar ao Início');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
  });

  test('calls reset function when retry button is clicked', async () => {
    const errorObj = new Error('Test error message');
    const mockReset = vi.fn();

    render(<ErrorComponent error={errorObj} reset={mockReset} />);

    const retryButton = screen.getByText('Tentar novamente');
    await userEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
