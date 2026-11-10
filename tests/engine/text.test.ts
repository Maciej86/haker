import { test, expect } from 'vitest';
import { esc, fmt, fmtSkill, fill } from '../../src/engine/text';
test('esc zamienia znaki HTML', () => {
  expect(esc('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
});
test('fmt formatuje po polsku', () => {
  expect(fmt(300)).toBe('300');
  expect(fmt(12500)).toBe('12\u00a0500');           // pl-PL grupuje dopiero od 5 cyfr, spacja niełamliwa
});
test('fmtSkill pokazuje przecinek i ucina zera', () => {
  expect(fmtSkill(1.6)).toBe('1,6');
  expect(fmtSkill(0.30000000000000004)).toBe('0,3');
  expect(fmtSkill(2)).toBe('2');
});
test('fill wstawia {dzień} i zostawia nieznane', () => {
  expect(fill('termin: {dzień} 19:00 {x}', { 'dzień': 'czw' })).toBe('termin: czw 19:00 {x}');
});
