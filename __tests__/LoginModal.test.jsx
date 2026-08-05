import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

const copy = {
  loginTitle: 'Bem-vindo de volta',
  registerTitle: 'Cria a tua conta',
  loginSubtitle: 'Entra para continuares a planear e aceder às tuas viagens.',
  registerSubtitle: 'Guarda viagens, preferências e alterações com segurança.',
  name: 'Nome',
  namePlaceholder: 'O teu nome',
  email: 'Email',
  emailPlaceholder: 'nome@exemplo.com',
  password: 'Palavra-passe',
  passwordPlaceholder: 'Mínimo de 8 caracteres',
  loginAction: 'Entrar',
  registerAction: 'Criar conta',
  processing: 'A processar…',
  googleAction: 'Continuar com Google',
  googleLoading: 'A ligar ao Google…',
  divider: 'ou usa o teu email',
  switchToRegister: 'Ainda não tens conta? Criar conta',
  switchToLogin: 'Já tens conta? Entrar',
  allFieldsRequired: 'Preenche todos os campos.',
  credentialsRequired: 'Introduz o email e a palavra-passe.',
  passwordLength: 'A palavra-passe deve ter pelo menos 8 caracteres.',
  googleUnavailable: 'Google indisponível neste ambiente.',
  googleCancelled: 'O login Google foi cancelado.',
  googleFailed: 'Não foi possível concluir o login Google.',
  googleProfileFailed: 'Não foi possível criar o perfil.',
  close: 'Fechar autenticação',
};

vi.mock('../app/context/AuthContext', () => ({
  useAuth: () => authMocks,
}));

vi.mock('../app/context/LanguageContext', () => ({
  useTranslations: () => (key) => copy[key] || key,
}));

import LoginModal from '../app/components/LoginModal';

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.login.mockResolvedValue({ success: true });
    authMocks.register.mockResolvedValue({ success: true });
    authMocks.loginWithGoogle.mockResolvedValue({ success: true, redirecting: true });
  });

  it('is an accessible, fully localized login dialog', () => {
    render(<LoginModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Palavra-passe')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: 'Fechar autenticação' })).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('validates registration locally and submits normalized fields', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LoginModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Ainda não tens conta? Criar conta' }));
    await user.click(screen.getByRole('button', { name: 'Criar conta', exact: true }));
    expect(screen.getByRole('alert')).toHaveTextContent('Preenche todos os campos.');

    await user.type(screen.getByLabelText('Nome'), '  Maria Teste  ');
    await user.type(screen.getByLabelText('Email'), '  maria@example.test  ');
    await user.type(screen.getByLabelText('Palavra-passe'), 'Andor-2026');
    await user.click(screen.getByRole('button', { name: 'Criar conta', exact: true }));

    expect(authMocks.register).toHaveBeenCalledWith(
      'Maria Teste',
      'maria@example.test',
      'Andor-2026'
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a real Google configuration error instead of simulating a user', async () => {
    const user = userEvent.setup();
    authMocks.loginWithGoogle.mockResolvedValue({ error: 'Google indisponível neste ambiente.' });
    render(<LoginModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Continuar com Google' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Google indisponível neste ambiente.');
  });

  it('surfaces a safe callback cancellation message', () => {
    render(
      <LoginModal
        isOpen
        initialErrorCode="google_cancelled"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('O login Google foi cancelado.');
  });

  it('passes the requested post-login path to Google OAuth', async () => {
    const user = userEvent.setup();
    render(
      <LoginModal
        isOpen
        redirectPath="/invitations/test-token"
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continuar com Google' }));

    expect(authMocks.loginWithGoogle).toHaveBeenCalledWith('/invitations/test-token');
  });
});
