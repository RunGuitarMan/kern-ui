import { KERN_CATALOG } from '@kern-ui/showcase';
import { KERN_PLAYGROUND_DEFINITIONS } from '@kern-ui/showcase/specimen';

import {
  russianAccessibilityFor,
  russianApiDescriptionFor,
  russianDoFor,
  russianDontFor,
  russianGuidanceFor,
  russianKeyboardFor,
} from './docs-i18n-ru-guidance';

const CYRILLIC = /\p{Script=Cyrillic}/u;

function expectRussian(value: string, path: string): void {
  expect(value.trim(), `${path}: empty copy`).not.toBe('');
  expect(value, `${path}: Russian copy`).toMatch(CYRILLIC);
}

describe('Russian catalog guidance', () => {
  it('returns Russian keyboard, accessibility, do, and dont copy for all catalog entries', () => {
    expect(KERN_CATALOG).toHaveLength(132);

    for (const item of KERN_CATALOG) {
      const guidance = russianGuidanceFor(item);

      expect(guidance.keyboard, `${item.id}: keyboard`).toEqual(russianKeyboardFor(item));
      expect(guidance.accessibility, `${item.id}: accessibility`).toEqual(
        russianAccessibilityFor(item),
      );
      expect(guidance.do, `${item.id}: do`).toBe(russianDoFor(item));
      expect(guidance.dont, `${item.id}: dont`).toBe(russianDontFor(item));

      expect(guidance.keyboard.length, `${item.id}: keyboard length`).toBeGreaterThan(0);
      for (const [index, line] of guidance.keyboard.entries()) {
        expectRussian(line, `${item.id}.keyboard[${index}]`);
      }
      expect(guidance.keyboard, `${item.id}: no English keyboard fallback`).not.toEqual(
        item.keyboard,
      );

      expect(guidance.accessibility.length, `${item.id}: accessibility length`).toBeGreaterThan(0);
      for (const [index, line] of guidance.accessibility.entries()) {
        expectRussian(line, `${item.id}.accessibility[${index}]`);
      }
      expect(guidance.accessibility, `${item.id}: no English accessibility fallback`).not.toEqual(
        item.accessibility,
      );

      expectRussian(guidance.do, `${item.id}.do`);
      expectRussian(guidance.dont, `${item.id}.dont`);
      expect(guidance.do, `${item.id}: no English do fallback`).not.toBe(item.do);
      expect(guidance.dont, `${item.id}: no English dont fallback`).not.toBe(item.dont);
    }
  });

  it('returns Russian API descriptions for every public catalog binding', () => {
    let apiRows = 0;
    const sourceDescriptions = new Set<string>();

    for (const item of KERN_CATALOG) {
      for (const row of item.api) {
        apiRows += 1;
        sourceDescriptions.add(row.description);
        const translated = russianApiDescriptionFor(row);
        const unknownFallback = russianApiDescriptionFor({
          ...row,
          description: 'A future API description not known to this catalog.',
        });
        expectRussian(translated, `${item.id}.api.${row.name}`);
        expect(translated, `${item.id}.${row.name}: no English API fallback`).not.toBe(
          row.description,
        );
        expect(translated, `${item.id}.${row.name}: exact description translation`).not.toBe(
          unknownFallback,
        );
      }
    }

    expect(apiRows).toBe(1_147);
    expect(sourceDescriptions.size).toBe(417);
  });

  it('preserves the specific meaning of representative API descriptions', () => {
    function translated(componentId: string, bindingName: string): string {
      const component = KERN_CATALOG.find((item) => item.id === componentId);
      const row = component?.api.find((candidate) => candidate.name === bindingName);
      expect(row, `${componentId}.${bindingName}: binding exists`).toBeDefined();
      return russianApiDescriptionFor(row!);
    }

    expect(translated('header', 'stickyOffset')).toMatch(/отступ.*границ|границ.*отступ/u);
    expect(translated('select', 'options')).toMatch(/набор.*вариант|вариант.*набор/u);
    expect(translated('dialog', 'closeOnEscape')).toMatch(/Escape.*закры/u);
    expect(translated('data-grid', 'data')).toMatch(/данн/u);
    expect(translated('textarea', 'rows')).toMatch(/строк/u);
  });

  it('returns exact Russian descriptions for every playground control', () => {
    let controlRows = 0;
    const sourceDescriptions = new Set<string>();

    for (const definition of KERN_PLAYGROUND_DEFINITIONS) {
      for (const control of definition.controls) {
        controlRows += 1;
        sourceDescriptions.add(control.description);
        const kind = control.binding.kind === 'model' ? 'model' : 'input';
        const name =
          control.binding.kind === 'input' || control.binding.kind === 'model'
            ? control.binding.publicName
            : control.key;
        const row = { name, kind, description: control.description } as const;
        const translated = russianApiDescriptionFor(row);
        const unknownFallback = russianApiDescriptionFor({
          ...row,
          description: 'A future playground description not known to this catalog.',
        });

        expectRussian(translated, `${definition.id}.controls.${control.key}`);
        expect(
          translated,
          `${definition.id}.${control.key}: exact control description translation`,
        ).not.toBe(unknownFallback);
      }
    }

    expect(KERN_PLAYGROUND_DEFINITIONS).toHaveLength(132);
    expect(controlRows).toBe(695);
    expect(sourceDescriptions.size).toBe(379);
  });

  it('preserves the specific meaning of representative playground controls', () => {
    function translated(controlKey: string): string {
      const definition = KERN_PLAYGROUND_DEFINITIONS.find((item) => item.id === 'text-input');
      const control = definition?.controls.find((candidate) => candidate.key === controlKey);
      expect(control, `text-input.${controlKey}: control exists`).toBeDefined();
      return russianApiDescriptionFor({
        name: control!.key,
        kind: 'input',
        description: control!.description,
      });
    }

    expect(translated('placeholder')).toMatch(/пуст.*знач|подсказ/u);
    expect(translated('size')).toMatch(/высот.*отступ|отступ.*высот/u);
    expect(translated('disabled')).toMatch(/запрещ.*взаимодейств/iu);
    expect(translated('readOnly')).toMatch(/фокус.*(?:измен|редакт)|(?:измен|редакт).*фокус/iu);
    expect(translated('invalid')).toMatch(/ошиб|ARIA|невалид/u);
  });

  it('names an unknown API field and its binding kind in the Russian fallback', () => {
    const description = 'Future behavior that is not part of the current catalog.';
    const input = russianApiDescriptionFor({ name: 'futureInput', kind: 'input', description });
    const model = russianApiDescriptionFor({ name: 'futureModel', kind: 'model', description });
    const output = russianApiDescriptionFor({ name: 'futureOutput', kind: 'output', description });

    expectRussian(input, 'future input');
    expect(input).toContain('futureInput');
    expect(input).toContain('входное свойство');

    expectRussian(model, 'future model');
    expect(model).toContain('futureModel');
    expect(model).toContain('двусторонняя модель');

    expectRussian(output, 'future output');
    expect(output).toContain('futureOutput');
    expect(output).toContain('выходное событие');
  });
});
