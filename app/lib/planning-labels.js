export const BOOKING_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Não iniciado' },
  { value: 'searching', label: 'A pesquisar' },
  { value: 'selected', label: 'Selecionado' },
  { value: 'booked', label: 'Reservado' },
  { value: 'confirmed', label: 'Confirmado' },
];

export const DOCUMENT_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Não iniciado' },
  { value: 'needed', label: 'Necessário' },
  { value: 'ready', label: 'Pronto' },
  { value: 'uploaded_confirmed', label: 'Confirmado' },
  { value: 'not_applicable', label: 'Não aplicável' },
];

const optionMap = (options) => Object.fromEntries(options.map((option) => [option.value, option.label]));

export const BOOKING_STATUS_LABELS = optionMap(BOOKING_STATUS_OPTIONS);
export const DOCUMENT_STATUS_LABELS = optionMap(DOCUMENT_STATUS_OPTIONS);
export const PRIORITY_LABELS = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};
export const DOCUMENT_IMPORTANCE_LABELS = {
  required: 'Obrigatório',
  recommended: 'Recomendado',
  optional: 'Opcional',
};

export const BACKUP_TRIGGER_LABELS = {
  bad_weather: 'Mau tempo ou condições exteriores inseguras',
  flight_delay: 'Atraso no voo, comboio ou chegada',
  late_hotel_check_in: 'Check-in tardio ou quarto indisponível',
  activity_unavailable: 'Atividade esgotada, fechada ou indisponível',
  restaurant_full: 'Restaurante cheio, fechado ou indisponível',
  tired_day: 'Dia de pouca energia ou cansaço',
  lower_budget: 'Necessidade de reduzir o orçamento',
  no_rental_car: 'Rent-a-car indisponível ou pouco prático',
  public_transport_disruption: 'Falha ou interrupção de transporte público',
  mobility_change: 'Alteração das necessidades de mobilidade',
  company_schedule_change: 'Alteração da agenda do cliente ou da empresa',
};

export function bookingStatusLabel(value) {
  return BOOKING_STATUS_LABELS[value] || value || 'Não iniciado';
}

export function documentStatusLabel(value) {
  return DOCUMENT_STATUS_LABELS[value] || value || 'Necessário';
}

export function priorityLabel(value) {
  return PRIORITY_LABELS[value] || value || 'Média';
}

export function documentImportanceLabel(value) {
  return DOCUMENT_IMPORTANCE_LABELS[value] || value || 'Recomendado';
}

export function planningStatusLabel(value) {
  return BOOKING_STATUS_LABELS[value] || DOCUMENT_STATUS_LABELS[value] || value || 'Pendente';
}

export function backupTriggerLabel(item = {}) {
  return BACKUP_TRIGGER_LABELS[item.id] || item.trigger || item.title || item.label || 'Alteração do plano';
}
