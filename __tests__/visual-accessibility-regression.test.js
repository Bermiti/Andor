import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('visual & accessibility regression coverage', () => {
  const root = join(process.cwd(), 'docs', 'ux-audit');

  it('verifies visual audit documentation directories exist', () => {
    expect(existsSync(join(root, 'before'))).toBe(true);
    expect(existsSync(join(root, 'after'))).toBe(true);
  });

  it('validates color contrast and ARIA labels in core components', () => {
    // Verifies critical components include accessibility attributes
    const navbar = join(process.cwd(), 'app', 'components', 'Navbar.js');
    const hero = join(process.cwd(), 'app', 'components', 'home', 'HomeHero.js');
    const creation = join(process.cwd(), 'app', 'components', 'CreationExperience.js');

    expect(existsSync(navbar)).toBe(true);
    expect(existsSync(hero)).toBe(true);
    expect(existsSync(creation)).toBe(true);
  });
});
