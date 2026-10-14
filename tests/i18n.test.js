import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, phrases } from '../js/translations.js';
import { extraLanguages, extraTranslations } from '../js/translations-extra.js';
import { t } from '../js/i18n.js';

test('All 18 languages cover every interface phrase and preserve parameters', () => {
  const codes = {...languages,...extraLanguages};
  assert.equal(Object.keys(codes).length,18);
  for(const required of ['tr','bg','el','ka','hy','az','fa','ar','ro','uk','ru','he','ku','ckb']) assert.ok(codes[required]);
  const parameters = text => [...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  const keys = new Set();
  for(const row of phrases){
    assert.ok(!keys.has(row[0]),row[0]); keys.add(row[0]);
    assert.equal(row.length,7);
    for(const value of row) { assert.ok(value.trim()); assert.deepEqual(parameters(value),parameters(row[0])); }
    for(const code of Object.keys(extraLanguages)){
      const value=extraTranslations[code][row[0]];
      assert.ok(value?.trim(),`${code}: ${row[0]}`);
      assert.deepEqual(parameters(value),parameters(row[0]),`${code}: ${row[0]}`);
    }
  }
});
test('Confirmations and unknown product data retain literal user input', () => {
  const name='SAYDER <script> & "ürün"';
  assert.equal(t('“{name}” kalıcı olarak silinsin mi?',{name},'en'),`Permanently delete “${name}”?`);
  assert.equal(t('Unique product name',{},'ar'),'Unique product name');
  assert.equal(t('Ürün kataloğu',{},'bg'),'Продуктов каталог');
});
