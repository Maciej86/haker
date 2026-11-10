// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it, vi, afterEach } from 'vitest';
import { THEMES, pickTheme, applyTheme } from '../../src/theme/themes';
import { getPref, setPref } from '../../src/ui/prefs';

afterEach(() => vi.restoreAllMocks());

it('THEMES: 4 motywy z paskami kolorów z makiety', () => {
  expect(THEMES.map(t => [t.id, t.name, t.req])).toEqual([
    ['fosfor', 'Fosfor', 0], ['neon', 'Neon', 1], ['bursztyn', 'Bursztyn', 2], ['halo', 'Halo Systems', 3]]);
  expect(THEMES.map(t => t.sw)).toEqual([
    ['#0a1116', '#1d4446', '#34f0b0', '#f4b942'], ['#120c26', '#3a2a6e', '#3ee8ff', '#ff3d8b'],
    ['#0f0b05', '#4a3512', '#ffb000', '#ff5a36'], ['#0b0f17', '#2b3a52', '#9cc8ff', '#f4d27a']]);
});
it('pickTheme przepuszcza tylko odblokowany motyw', () => {
  expect(pickTheme('neon', ['fosfor', 'neon'])).toBe('neon');
  expect(pickTheme('halo', ['fosfor'])).toBe('fosfor');
  expect(pickTheme(null, ['fosfor'])).toBe('fosfor');
  expect(pickTheme('śmieci', ['fosfor', 'neon'])).toBe('fosfor');
});
it('applyTheme ustawia data-theme i zapisuje wybór', () => {
  applyTheme('bursztyn');
  expect(document.documentElement.dataset.theme).toBe('bursztyn');
  expect(localStorage.getItem('neonos-theme')).toBe('bursztyn');
});
it('tokens.css: Fosfor i nadpisania motywów', () => {
  const css = readFileSync('src/theme/tokens.css', 'utf8').replace(/\s+/g, '');
  for (const t of ['--bg:#0a1116', '--acc:#34f0b0', '--acc-rgb:52,240,176', '--on-acc:#04241a', '--coin:#f4b942', '--red:#ff5d73',
    '--term:#071014', '--rain:rgba(140,240,210,.16)', '--blue:#5fa8d3', ':root[data-theme=neon]{--bg:#120c26',
    ':root[data-theme=bursztyn]{--bg:#0f0b05', '--acc:#ffb000', ':root[data-theme=halo]{--bg:#0b0f17'])
    expect(css).toContain(t);
  expect(css).not.toContain('amber');
});
it('ustawienia przeżywają zablokowany localStorage', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(getPref('neonos-rain', 'on')).toBe('on');
  expect(() => setPref('neonos-rain', 'off')).not.toThrow();
});
