import { describe, expect, test } from 'vitest';
import {
  backupTriggerLabel,
  bookingStatusLabel,
  documentImportanceLabel,
  documentStatusLabel,
  planningStatusLabel,
  priorityLabel,
} from '../app/lib/planning-labels';

describe('planning labels', () => {
  test('turns persisted workflow values into readable Portuguese labels', () => {
    expect(bookingStatusLabel('not_started')).toBe('Não iniciado');
    expect(documentStatusLabel('uploaded_confirmed')).toBe('Confirmado');
    expect(documentImportanceLabel('required')).toBe('Obrigatório');
    expect(priorityLabel('critical')).toBe('Crítica');
    expect(planningStatusLabel('needed')).toBe('Necessário');
  });

  test('uses stable translated trigger labels for known backup plans', () => {
    expect(backupTriggerLabel({ id: 'bad_weather', trigger: 'Bad weather' })).toContain('Mau tempo');
    expect(backupTriggerLabel({ id: 'custom', trigger: 'Plano especial' })).toBe('Plano especial');
  });
});
