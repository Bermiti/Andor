import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ToastProvider, useToast } from '../app/components/ToastProvider';

function TestComponent({ action, message, type = 'success' }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast[type](message)}>
      {action}
    </button>
  );
}

test('renders a success toast', async () => {
  render(
    <ToastProvider>
      <TestComponent action="Show Toast" message="This is a test success message" type="success" />
    </ToastProvider>
  );

  const button = screen.getByText('Show Toast');
  await userEvent.click(button);

  const toastMessage = await screen.findByText('This is a test success message');
  expect(toastMessage).toBeInTheDocument();
  // Icon 'OK' for success
  expect(screen.getByText('OK')).toBeInTheDocument();
});

test('renders an error toast', async () => {
  render(
    <ToastProvider>
      <TestComponent action="Show Error" message="This is a test error message" type="error" />
    </ToastProvider>
  );

  const button = screen.getByText('Show Error');
  await userEvent.click(button);

  const toastMessage = await screen.findByText('This is a test error message');
  expect(toastMessage).toBeInTheDocument();
  // Icon '!' for error
  expect(screen.getByText('!')).toBeInTheDocument();
});

test('closes toast manually when clicking close button', async () => {
  render(
    <ToastProvider>
      <TestComponent action="Show" message="Closable message" type="info" />
    </ToastProvider>
  );

  const button = screen.getByText('Show');
  await userEvent.click(button);

  const toastMessage = await screen.findByText('Closable message');
  expect(toastMessage).toBeInTheDocument();

  const closeBtn = screen.getByLabelText('Dismiss notification');
  await userEvent.click(closeBtn);

  // We have a 220ms exiting phase timeout. We wait for it to be removed from the DOM.
  await waitFor(() => {
    expect(screen.queryByText('Closable message')).not.toBeInTheDocument();
  }, { timeout: 1000 });
});
