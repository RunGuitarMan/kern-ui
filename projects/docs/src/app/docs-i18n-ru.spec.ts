import { KERN_CATALOG_FAMILIES, KERN_CATALOG_INDEX } from '@kern-ui/showcase/catalog-index';

import { RU_COMPONENT_FAMILIES, RU_COMPONENT_SUMMARIES, RU_TEXT } from './docs-i18n-ru';
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

  it('provides a Russian summary for every catalog id', () => {
    const catalogIds = KERN_CATALOG_INDEX.map(({ id }) => id).sort();
    const translatedIds = Object.keys(RU_COMPONENT_SUMMARIES).sort();

    expect(translatedIds).toEqual(catalogIds);
    for (const id of catalogIds) {
      expect(RU_COMPONENT_SUMMARIES[id].trim(), id).not.toBe('');
      expect(RU_COMPONENT_SUMMARIES[id], id).toMatch(/[А-ЯЁа-яё]/);
    }
  });

  it('provides Russian copy for every family, member role, and migration', () => {
    const familyIds = KERN_CATALOG_FAMILIES.map(({ id }) => id).sort();
    expect(Object.keys(RU_COMPONENT_FAMILIES).sort()).toEqual(familyIds);

    for (const family of KERN_CATALOG_FAMILIES) {
      const translated = RU_COMPONENT_FAMILIES[family.id as keyof typeof RU_COMPONENT_FAMILIES];
      expect(translated.name, `${family.id}: name`).toMatch(/[А-ЯЁа-яё]/);
      expect(translated.description, `${family.id}: description`).toMatch(/[А-ЯЁа-яё]/);
      expect(Object.keys(translated.members).sort(), `${family.id}: members`).toEqual(
        family.members.map(({ id }) => id).sort(),
      );

      for (const member of family.members) {
        const translatedMember = translated.members[member.id];
        expect(translatedMember.role, `${family.id}/${member.id}: role`).toMatch(/[А-ЯЁа-яё]/);
        expect(Boolean(translatedMember.migration), `${family.id}/${member.id}: migration`).toBe(
          Boolean(member.migration),
        );
        if (translatedMember.migration) {
          expect(translatedMember.migration, `${family.id}/${member.id}: migration copy`).toMatch(
            /[А-ЯЁа-яё]/,
          );
        }
      }
    }
  });
});
