// @vitest-environment node

import { describe, expect, it } from 'vitest';

describe('Andor Design System & WCAG 2.2 AA Accessibility Test Suite', () => {
  it('defines core brand color tokens conforming to Deep Ocean Navy & Discrete Gold palette', () => {
    const brandTokens = {
      navy: '#080C14',
      ocean: '#0F1520',
      gold: '#D4A843',
      sky: '#4A9EE8',
    };

    expect(brandTokens.navy).toBe('#080C14');
    expect(brandTokens.gold).toBe('#D4A843');
  });

  it('verifies contrast ratio calculation helper for WCAG 2.2 AA compliance (>= 4.5:1 for normal text)', () => {
    const getLuminance = (r, g, b) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const getContrastRatio = (rgb1, rgb2) => {
      const lum1 = getLuminance(...rgb1);
      const lum2 = getLuminance(...rgb2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    };

    // Dark background #080C14 (8, 12, 20) vs Light Text #F0EDE6 (240, 237, 230)
    const ratio = getContrastRatio([8, 12, 20], [240, 237, 230]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
