import { RU_TEXT } from './docs-i18n-ru';
import { RU_SHELL_TEXT } from './docs-i18n-shell-ru';

describe('Russian documentation dictionaries', () => {
  it('covers taxonomy and recipe navigation labels', () => {
    const detailedKeys = [
      'component.relationships',
      'component.family',
      'component.current',
      'component.migration',
      'component.aliases',
      'component.sameImplementation',
      'component.aliasDescription',
      'playground.stories',
      'playground.chooseStory',
      'playground.essential',
      'playground.essentialNote',
      'playground.allProperties',
      'playground.allPropertiesNote',
    ] as const;

    for (const key of detailedKeys) expect(RU_TEXT[key]).toBeTruthy();
    expect(RU_SHELL_TEXT['shell.recipes']).toBe('Рецепты');
  });
});
