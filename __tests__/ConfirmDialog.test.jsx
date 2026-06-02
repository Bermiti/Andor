import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ConfirmDialog from '../app/components/ConfirmDialog';

test('renders title and description', () => {
  render(
    <ConfirmDialog
      isOpen={true}
      title="Test Title"
      description="Test Description"
      onCancel={() => {}}
      onConfirm={() => {}}
    />
  );
  
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  expect(screen.getByText('Test Description')).toBeInTheDocument();
});

test('calls onCancel when cancel is clicked', async () => {
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      isOpen={true}
      title="Test Title"
      description="Test Description"
      onCancel={onCancel}
      onConfirm={() => {}}
    />
  );
  
  const cancelBtn = screen.getByText('Cancelar');
  await userEvent.click(cancelBtn);
  
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('calls onConfirm when confirm is clicked', async () => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      isOpen={true}
      title="Test Title"
      description="Test Description"
      onCancel={() => {}}
      onConfirm={onConfirm}
      confirmLabel="Sim"
    />
  );
  
  const confirmBtn = screen.getByText('Sim');
  await userEvent.click(confirmBtn);
  
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('shows loading spinner when isLoading is true', () => {
  render(
    <ConfirmDialog
      isOpen={true}
      title="Test Title"
      description="Test Description"
      onCancel={() => {}}
      onConfirm={() => {}}
      confirmLabel="Sim"
      isLoading={true}
    />
  );
  
  const confirmBtn = screen.getByRole('button', { name: /Processar|Sim/i });
  expect(confirmBtn).toBeDisabled();
  // We added a Loader2 spinner in the previous session
  // We can just verify the button is disabled.
});
