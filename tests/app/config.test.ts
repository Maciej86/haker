import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../../vite.config';

describe('konfiguracja projektu', () => {
  it('buduje grę pod ścieżką /haker/', () => {
    expect((config as { base?: string }).base).toBe('/haker/');
  });
  it('index.html ładuje JetBrains Mono z Google Fonts i ma lang="pl"', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('<html lang="pl">');
    expect(html).toContain('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    expect(html).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
    expect(html).toContain('<title>NeonOS</title>');
    expect(html).toContain('<div id="root"></div>');
  });
});
