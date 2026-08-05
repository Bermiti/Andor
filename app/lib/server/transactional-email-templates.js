const BRAND_NAME = 'Andor';
const DEFAULT_ORIGIN = 'https://andor.travels';

export const EMAIL_TEMPLATE_IDS = Object.freeze([
  'email_verification',
  'welcome',
  'password_reset',
  'trip_created',
  'group_invitation',
  'trip_changed',
  'trip_upcoming',
  'feedback_request',
]);

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function requiredText(value, field) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`Missing email template field: ${field}`);
  return text;
}

function safeHeaderText(value) {
  return String(value).replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function safeActionUrl(value, field) {
  const raw = requiredText(value, field);
  let url;
  try {
    url = new URL(raw, DEFAULT_ORIGIN);
  } catch {
    throw new Error(`Invalid email template URL: ${field}`);
  }

  const isLocalDevelopment = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocalDevelopment) {
    throw new Error(`Unsafe email template URL: ${field}`);
  }
  return url.toString();
}

function greeting(firstName) {
  const name = String(firstName || '').trim();
  return name ? `Olá, ${name}.` : 'Olá.';
}

function templateCopy(templateId, variables) {
  const destination = variables.destination ? String(variables.destination).trim() : '';

  switch (templateId) {
    case 'email_verification':
      return {
        subject: 'Confirma o teu email na Andor',
        preheader: 'Conclui a criação da tua conta.',
        heading: 'Confirma o teu email',
        paragraphs: [
          `${greeting(variables.firstName)} Usa o botão abaixo para confirmar que este endereço de email é teu.`,
          'Se não criaste uma conta Andor, podes ignorar esta mensagem.',
        ],
        actionLabel: 'Confirmar email',
        actionUrl: safeActionUrl(variables.verificationUrl, 'verificationUrl'),
      };
    case 'welcome':
      return {
        subject: 'Bem-vindo à Andor',
        preheader: 'Começa a organizar uma viagem à tua medida.',
        heading: 'A tua próxima viagem começa aqui',
        paragraphs: [
          `${greeting(variables.firstName)} A Andor ajuda-te a transformar preferências reais num itinerário organizado por dias.`,
          'Revê sempre horários, preços e reservas antes de partir: dados não verificados são apresentados como estimativas no produto.',
        ],
        actionLabel: 'Planear uma viagem',
        actionUrl: safeActionUrl(variables.plannerUrl, 'plannerUrl'),
      };
    case 'password_reset':
      return {
        subject: 'Recupera o acesso à Andor',
        preheader: 'Cria uma nova palavra-passe através de uma ligação segura.',
        heading: 'Pedido de recuperação',
        paragraphs: [
          `${greeting(variables.firstName)} Recebemos um pedido para alterar a palavra-passe da tua conta.`,
          'Se não fizeste este pedido, ignora esta mensagem e a palavra-passe atual mantém-se.',
        ],
        actionLabel: 'Criar nova palavra-passe',
        actionUrl: safeActionUrl(variables.recoveryUrl, 'recoveryUrl'),
      };
    case 'trip_created':
      return {
        subject: `A tua proposta de viagem para ${requiredText(destination, 'destination')} está pronta`,
        preheader: 'Revê o itinerário e confirma os detalhes antes de reservar.',
        heading: `Primeira versão: ${destination}`,
        paragraphs: [
          `${greeting(variables.firstName)} Criámos uma proposta de itinerário com base nas preferências indicadas.`,
          'Abre a viagem para rever estimativas, ajustar atividades e verificar os detalhes que exigem confirmação externa.',
        ],
        actionLabel: 'Rever itinerário',
        actionUrl: safeActionUrl(variables.itineraryUrl, 'itineraryUrl'),
      };
    case 'group_invitation':
      return {
        subject: `${requiredText(variables.inviterName, 'inviterName')} convidou-te para uma viagem Andor`,
        preheader: `Consulta o convite para ${requiredText(destination, 'destination')}.`,
        heading: `Planeiem ${destination} em conjunto`,
        paragraphs: [
          `${variables.inviterName} convidou-te para participar no planeamento desta viagem.`,
          'Aceita apenas se reconheces a pessoa e o destino. A ligação é pessoal e não deve ser partilhada.',
        ],
        actionLabel: 'Ver convite',
        actionUrl: safeActionUrl(variables.invitationUrl, 'invitationUrl'),
      };
    case 'trip_changed':
      return {
        subject: `Atualização importante na viagem a ${requiredText(destination, 'destination')}`,
        preheader: 'Consulta o que mudou no itinerário.',
        heading: 'O itinerário foi atualizado',
        paragraphs: [
          `${greeting(variables.firstName)} Houve uma alteração relevante na viagem a ${destination}.`,
          requiredText(variables.changeSummary, 'changeSummary'),
        ],
        actionLabel: 'Consultar alteração',
        actionUrl: safeActionUrl(variables.itineraryUrl, 'itineraryUrl'),
      };
    case 'trip_upcoming':
      return {
        subject: `A viagem a ${requiredText(destination, 'destination')} aproxima-se`,
        preheader: 'Revê reservas, horários e detalhes pendentes.',
        heading: `Preparar ${destination}`,
        paragraphs: [
          `${greeting(variables.firstName)} A data de início indicada é ${requiredText(variables.startDate, 'startDate')}.`,
          'Confirma reservas, horários de funcionamento, transportes e documentos diretamente nas fontes oficiais.',
        ],
        actionLabel: 'Abrir checklist da viagem',
        actionUrl: safeActionUrl(variables.itineraryUrl, 'itineraryUrl'),
      };
    case 'feedback_request':
      return {
        subject: `Como correu a tua viagem a ${requiredText(destination, 'destination')}?`,
        preheader: 'O teu feedback ajuda a melhorar a Andor.',
        heading: 'Ajuda-nos a aprender',
        paragraphs: [
          `${greeting(variables.firstName)} Queremos perceber o que foi útil e o que deve melhorar.`,
          'O questionário é opcional e deve demorar apenas alguns minutos.',
        ],
        actionLabel: 'Dar feedback',
        actionUrl: safeActionUrl(variables.feedbackUrl, 'feedbackUrl'),
      };
    default:
      throw new Error(`Unknown email template: ${templateId}`);
  }
}

function renderHtml(copy, unsubscribeUrl) {
  const paragraphs = copy.paragraphs
    .map((paragraph) => `<p style="margin:0 0 18px;color:#334155;font-size:16px;line-height:1.65;">${escapeHtml(paragraph)}</p>`)
    .join('');
  const unsubscribe = unsubscribeUrl
    ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.5;"><a href="${escapeHtml(safeActionUrl(unsubscribeUrl, 'unsubscribeUrl'))}" style="color:#64748b;">Gerir preferências ou cancelar comunicações de marketing</a></p>`
    : '';

  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;background:#f4f1e9;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1e9;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
<tr><td style="background:#082f49;padding:24px 32px;color:#f8fafc;font-size:22px;font-weight:700;letter-spacing:.04em;">ANDOR</td></tr>
<tr><td style="padding:36px 32px 30px;"><h1 style="margin:0 0 22px;color:#082f49;font-size:28px;line-height:1.25;">${escapeHtml(copy.heading)}</h1>${paragraphs}
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td style="border-radius:999px;background:#c99b48;"><a href="${escapeHtml(copy.actionUrl)}" style="display:inline-block;padding:14px 24px;color:#082f49;text-decoration:none;font-size:16px;font-weight:700;">${escapeHtml(copy.actionLabel)}</a></td></tr></table>
<p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">Se o botão não funcionar, copia esta ligação:<br><a href="${escapeHtml(copy.actionUrl)}" style="color:#0f5f78;word-break:break-all;">${escapeHtml(copy.actionUrl)}</a></p></td></tr>
<tr><td style="border-top:1px solid #e2e8f0;padding:22px 32px;color:#64748b;font-size:12px;line-height:1.5;">${BRAND_NAME} · Uma viagem personalizada, organizada e adaptável, pronta para ser vivida.${unsubscribe}</td></tr>
</table></td></tr></table></body></html>`;
}

export function renderTransactionalEmail(templateId, variables = {}) {
  if (!EMAIL_TEMPLATE_IDS.includes(templateId)) throw new Error(`Unknown email template: ${templateId}`);
  const rawCopy = templateCopy(templateId, variables);
  const copy = {
    ...rawCopy,
    subject: safeHeaderText(rawCopy.subject),
    preheader: safeHeaderText(rawCopy.preheader),
  };
  return {
    templateId,
    subject: copy.subject,
    preheader: copy.preheader,
    html: renderHtml(copy, variables.unsubscribeUrl),
    text: [copy.heading, '', ...copy.paragraphs, '', `${copy.actionLabel}: ${copy.actionUrl}`].join('\n'),
  };
}
