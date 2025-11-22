import { describe, expect, test } from 'vitest';
import {
  adjustGlassOpacity,
  getContrastRatio,
  getRelativeLuminance,
  hexToRgb,
  meetsContrastRequirement,
} from './contrast';

describe('Contrast Utilities', () => {
  test('calcula luminosidade do branco como 1', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });

  test('calcula luminosidade do preto como 0', () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  test('contraste branco/preto é 21:1', () => {
    const ratio = getContrastRatio(1, 0);
    expect(ratio).toBe(21);
    expect(meetsContrastRequirement(ratio, 'AAA')).toBe(true);
  });

  test('ajusta opacidade em fundo escuro', () => {
    expect(adjustGlassOpacity(0.2)).toBeGreaterThan(0.7);
    expect(adjustGlassOpacity(0.2)).toBeLessThanOrEqual(0.95);
  });

  test('converte hex para rgb corretamente', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
});
