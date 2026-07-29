import {
  createKrnTranslations,
  krnFormatTranslation,
  KRN_ENGLISH_TRANSLATIONS,
  type KrnTranslationsPatch,
} from './i18n';
import { krnLocaleConfig, KRN_LOCALE_PACKS, KRN_RU_RU_LOCALE } from './locale-packs';

describe('KERN locale packs', () => {
  it('keeps every built-in pack structurally aligned with the English schema', () => {
    for (const pack of Object.values(KRN_LOCALE_PACKS)) {
      expect(Object.keys(pack.translations).sort()).toEqual(
        Object.keys(KRN_ENGLISH_TRANSLATIONS).sort(),
      );
      for (const group of Object.keys(KRN_ENGLISH_TRANSLATIONS) as Array<
        keyof typeof KRN_ENGLISH_TRANSLATIONS
      >) {
        expect(Object.keys(pack.translations[group]).sort()).toEqual(
          Object.keys(KRN_ENGLISH_TRANSLATIONS[group]).sort(),
        );
      }
    }
  });

  it('uses typed Russian formatters instead of unresolved placeholder strings', () => {
    const translations = KRN_RU_RU_LOCALE.translations;
    expect(translations.navigation.formatPageLabel?.(3)).toBe('Страница 3');
    expect(translations.navigation.formatNoCommandResults?.('экспорт')).toContain('экспорт');
    expect(translations.dataGrid.pageRange(21, 40, 91)).toBe('21–40 из 91');
    expect(translations.chart.formatPercentOfTotal?.('25 %')).toContain('25 %');
    expect(translations.forms.removeFile('report.pdf')).toContain('report.pdf');
    expect(translations.layout.primaryNavigation).toBe('Основная навигация');
    expect(translations.layout.secondaryNavigation).toBe('Дополнительная навигация');
    expect(translations.layout.scrollableContent).toBe('Прокручиваемое содержимое');
    expect(translations.layout.resizeAdjacentPanels).toBe('Изменить размер соседних панелей');
  });

  it('keeps legacy string patches and resolves only explicitly known tokens', () => {
    const patch = {
      navigation: {
        pageLabel: 'Seite {page}',
        resultRangeLabel: '{start} bis {end} von {total}',
        noCommandResults: 'Kein Treffer für {query}; {unknown} bleibt erhalten',
        commandAvailableMany: '{count} Befehle verfügbar',
      },
      chart: { percentOfTotal: '{value} vom Gesamtwert' },
    } satisfies KrnTranslationsPatch;
    const translations = createKrnTranslations(patch);

    expect(translations.navigation.formatPageLabel).toEqual(expect.any(Function));
    expect(translations.navigation.formatResultRangeLabel).toEqual(expect.any(Function));
    expect(translations.navigation.formatNoCommandResults).toEqual(expect.any(Function));
    expect(translations.navigation.formatCommandAvailableMany).toEqual(expect.any(Function));
    expect(translations.chart.formatPercentOfTotal).toEqual(expect.any(Function));
    expect(
      krnFormatTranslation(
        translations.navigation.pageLabel,
        { page: 7 },
        translations.navigation.formatPageLabel,
        7,
      ),
    ).toBe('Seite 7');
    expect(
      krnFormatTranslation(
        translations.navigation.resultRangeLabel,
        { start: 21, end: 40, total: 91 },
        translations.navigation.formatResultRangeLabel,
        21,
        40,
        91,
      ),
    ).toBe('21 bis 40 von 91');
    expect(
      krnFormatTranslation(
        translations.navigation.noCommandResults,
        { query: '{page}<script>' },
        translations.navigation.formatNoCommandResults,
        '{page}<script>',
      ),
    ).toBe('Kein Treffer für {page}<script>; {unknown} bleibt erhalten');
    expect(
      krnFormatTranslation(
        translations.navigation.commandAvailableMany,
        { count: 8 },
        translations.navigation.formatCommandAvailableMany,
        8,
      ),
    ).toBe('8 Befehle verfügbar');
    expect(
      krnFormatTranslation(
        translations.chart.percentOfTotal,
        { value: '25 %' },
        translations.chart.formatPercentOfTotal,
        '25 %',
      ),
    ).toBe('25 % vom Gesamtwert');
  });

  it('uses correct Russian plural forms for truncated chart summaries', () => {
    const additionalItems = KRN_RU_RU_LOCALE.translations.chart.additionalItems;
    if (!additionalItems) throw new Error('Russian chart translations must define additionalItems');

    expect([1, 2, 5, 11, 21].map((count) => additionalItems(count))).toEqual([
      'Ещё 1 точка данных',
      'Ещё 2 точки данных',
      'Ещё 5 точек данных',
      'Ещё 11 точек данных',
      'Ещё 21 точка данных',
    ]);
  });

  it('publishes immutable translation groups', () => {
    expect(Object.isFrozen(KRN_RU_RU_LOCALE)).toBe(true);
    expect(Object.isFrozen(KRN_RU_RU_LOCALE.translations)).toBe(true);
    expect(Object.isFrozen(KRN_RU_RU_LOCALE.translations.forms)).toBe(true);
  });

  it('adapts a locale pack to the public runtime configuration', () => {
    const config = krnLocaleConfig(KRN_RU_RU_LOCALE);

    expect(config.locale).toBe('ru-RU');
    expect(config.direction).toBe('ltr');
    expect(config.translations).toBe(KRN_RU_RU_LOCALE.translations);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
