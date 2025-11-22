/**
 * Calcula luminosidade relativa conforme WCAG 2.2.
 *
 * @param rgb - Objeto { r, g, b } com valores 0-255.
 * @returns Luminosidade entre 0 e 1.
 */
export const getRelativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calcula ratio de contraste entre duas cores.
 */
export const getContrastRatio = (luminance1: number, luminance2: number): number => {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Verifica se contraste atende WCAG AA (4.5:1) ou AAA (7:1).
 */
export const meetsContrastRequirement = (
  ratio: number,
  level: 'AA' | 'AAA' = 'AAA'
): boolean => {
  const threshold = level === 'AAA' ? 7 : 4.5;
  return ratio >= threshold;
};

/**
 * Ajusta opacidade de glassmorphism baseado em luminosidade de fundo.
 *
 * Conforme especificação: 70% base, aumenta até 95% em fundos escuros.
 */
export const adjustGlassOpacity = (backgroundLuminance: number): number => {
  const BASE_OPACITY = 0.7;

  if (backgroundLuminance < 0.4) {
    // Fundo escuro: aumenta opacidade
    return Math.min(0.95, BASE_OPACITY + (0.4 - backgroundLuminance) * 0.5);
  }

  if (backgroundLuminance > 0.8) {
    // Fundo claro: adiciona scrim (retorna base, scrim tratado no componente)
    return BASE_OPACITY;
  }

  return BASE_OPACITY;
};

/**
 * Converte HEX para RGB.
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.trim();
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  if (!result) {
    throw new Error('Invalid HEX color');
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};
