/**
 * The shell dictionary stays in the initial bundle so controls switch
 * immediately while the detailed Russian documentation loads lazily.
 */
export const RU_SHELL_TEXT: Readonly<Record<string, string>> = Object.freeze({
  'shell.skip': 'Перейти к документации',
  'shell.home': 'Главная страница документации KERN',
  'shell.openNavigation': 'Открыть навигацию по компонентам',
  'shell.closeNavigation': 'Закрыть навигацию по компонентам',
  'shell.projectLinks': 'Ссылки проекта',
  'shell.previewEnvironment': 'Окружение предпросмотра',
  'shell.theme': 'Тема',
  'shell.contrast': 'Высокая контрастность',
  'shell.density': 'Плотность',
  'shell.direction': 'Направление текста',
  'shell.locale': 'Язык',
  'shell.motion': 'Анимация',
  'shell.brand': 'Фирменный цвет',
  'shell.canvas': 'Ширина холста',
  'shell.system': 'Системная',
  'shell.light': 'Светлая',
  'shell.dark': 'Тёмная',
  'shell.compact': 'Компактная',
  'shell.comfortable': 'Обычная',
  'shell.spacious': 'Просторная',
  'shell.reduce': 'Сократить',
  'shell.full': 'Полная',
  'shell.fluid': 'По ширине',
  'shell.documentation': 'Документация',
  'shell.overview': 'Обзор',
  'shell.foundations': 'Основы',
  'shell.patterns': 'Паттерны',
  'shell.accessibility': 'Доступность',
  'shell.changelog': 'История изменений',
  'shell.essentialComponents': 'Основные компоненты',
  'shell.components': 'Компоненты',
  'shell.entries': 'компонентов описано',
  'search.aria': 'Поиск компонентов KERN',
  'search.placeholder': 'Перейти к компоненту…',
  'changelog.releaseState': 'Не опубликован',
});

export const RU_SHELL_TERMS: Readonly<Record<string, string>> = Object.freeze({
  System: 'Системная',
  Light: 'Светлая',
  Dark: 'Тёмная',
});
