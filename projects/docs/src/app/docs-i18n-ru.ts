import type { KernCategory, KernComponentStatus } from '@kern-ui/showcase/catalog-index';

export {
  russianAccessibilityFor,
  russianApiDescriptionFor,
  russianDoFor,
  russianDontFor,
  russianGuidanceFor,
  russianKeyboardFor,
} from './docs-i18n-ru-guidance';

export const RU_TEXT: Readonly<Record<string, string>> = Object.freeze({
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
  'shell.recipes': 'Рецепты',
  'shell.accessibility': 'Доступность',
  'shell.changelog': 'История изменений',
  'shell.essentialComponents': 'Основные компоненты',
  'shell.components': 'Компоненты',
  'shell.entries': 'компонентов описано',
  'search.aria': 'Поиск компонентов KERN',
  'search.placeholder': 'Перейти к компоненту…',

  'home.title': 'Единый ритм. Для любого продукта.',
  'home.summary':
    'Доступные Angular-компоненты, семантические токены и продуктовые паттерны для реальных интерфейсов.',
  'home.browse': 'Смотреть компоненты',
  'home.understand': 'Разобраться в системе',
  'home.coverage': 'Возможности библиотеки',
  'home.catalogEntries': 'компонентов в каталоге',
  'home.accessibilityTarget': 'цель по доступности',
  'home.runtimeThemes': 'темы во время выполнения',
  'home.quickStart': 'Быстрый старт',
  'home.quickTitle': 'Установите. Настройте. Соберите.',
  'home.minutes': '≈ 2 мин',
  'home.install': 'Установите пакет',
  'home.styles': 'Подключите общие стили',
  'home.import': 'Импортируйте только нужное',
  'home.importDescription': 'Каждый standalone-компонент можно подключать независимо.',
  'home.providerSetup': 'Настройка провайдера KERN',
  'home.startHere': 'С чего начать',
  'home.shortestPath': 'Выберите самый короткий путь.',
  'home.startDescription':
    'Начинайте с задачи. На каждой странице компонента есть рабочий пример и готовый для копирования Angular-код.',
  'home.routeFoundationsTitle': 'Подключите токены и темы',
  'home.routeFoundationsDescription':
    'Цвет, типографика, интервалы, плотность, анимация и runtime-контракты тем.',
  'home.routeFoundationsCta': 'Открыть основы',
  'home.routeComponentsTitle': 'Соберите взаимодействие',
  'home.routeComponentsDescription':
    'Начните с живого примера, затем скопируйте минимальную настройку Angular.',
  'home.routeComponentsCta': 'Открыть компоненты',
  'home.routePatternsTitle': 'Соберите продуктовый сценарий',
  'home.routePatternsDescription':
    'Адаптируемые рецепты для форм, настроек, навигации и экранов с большим объёмом данных.',
  'home.routePatternsCta': 'Смотреть паттерны',
  'home.commonBlocks': 'Популярные компоненты',
  'home.straightToComponent': 'Сразу к нужному компоненту.',
  'home.commonDescription':
    'Эти разделы покрывают основные задачи: действия, формы, оверлеи, данные и адаптивную структуру приложения.',
  'home.popularComponents': 'Популярные компоненты',
  'home.preview': 'Предпросмотр документации',
  'home.matchContext': 'Настройте примеры под контекст своего продукта.',
  'home.previewDescription':
    'Эти настройки обновляют все живые примеры документации, не изменяя публичные примеры API.',
  'home.theme': 'Тема',
  'home.density': 'Плотность',
  'home.direction': 'Направление',
  'home.accessibilityGuidance': 'Рекомендации по доступности',

  'component.lifecycle': 'Статус жизненного цикла',
  'component.variantOf': 'Вариант компонента',
  'component.relationships': 'Взаимосвязи компонентов',
  'component.family': 'Семейство компонентов',
  'component.current': 'Текущий',
  'component.migration': 'Переход',
  'component.aliases': 'Поддерживаемые псевдонимы и варианты',
  'component.sameImplementation': 'Одна реализация',
  'component.aliasDescription':
    'Эти публичные названия по-прежнему поддерживаются, но их документация ведёт на эту основную страницу.',
  'component.copy': 'Копировать',
  'component.onThisPage': 'На этой странице',
  'component.example': 'Пример',
  'component.compositions': 'Композиции',
  'component.accessibility': 'Доступность',
  'component.guidance': 'Рекомендации',
  'component.reference': 'Справочник',
  'component.generatedContract': 'Сгенерированный публичный контракт',
  'component.entries': 'полей',
  'component.name': 'Название',
  'component.kind': 'Вид',
  'component.type': 'Тип',
  'component.default': 'По умолчанию',
  'component.description': 'Описание',
  'component.required': 'обязательно',
  'component.behavior': 'Поведение',
  'component.keyboardA11y': 'Клавиатура и доступность',
  'component.notes': 'заметок',
  'component.keyboardContract': 'Клавиатурный контракт',
  'component.accessibilityNotes': 'Примечания по доступности',
  'component.whenHow': 'Когда и как использовать',
  'component.doDont': 'Можно / нельзя',
  'component.do': 'Можно',
  'component.dont': 'Нельзя',
  'component.adjacent': 'Соседние компоненты',
  'component.previous': '← Назад',
  'component.next': 'Далее →',
  'component.notFoundCode': '404 / КОМПОНЕНТ',
  'component.notFound': 'Этого компонента нет в каталоге.',
  'component.returnOverview': 'Вернуться к обзору',

  'playground.example': 'Пример',
  'playground.view': 'Вид примера',
  'playground.preview': 'Предпросмотр',
  'playground.code': 'Код',
  'playground.openCanvas': 'Открыть холст',
  'playground.reset': 'Сбросить',
  'playground.copyCode': 'Копировать код',
  'playground.fluidCanvas': 'Холст по ширине',
  'playground.phoneCanvas': 'Телефон · 390 px',
  'playground.tabletCanvas': 'Планшет · 768 px',
  'playground.highContrast': 'высокая контрастность',
  'playground.codeAria': 'Пример Angular-кода',
  'playground.codeNote':
    'Базовый шаблон проверен строгой AOT-компиляцией; текущие настройки формируют снимок предпросмотра.',
  'playground.properties': 'Свойства',
  'playground.configure': 'Настройте пример',
  'playground.propertiesCount': 'свойств',
  'playground.stories': 'Примеры',
  'playground.chooseStory': 'Выберите показательное состояние',
  'playground.essential': 'Основные',
  'playground.essentialNote': 'Настройки, которые лучше всего объясняют этот компонент.',
  'playground.allProperties': 'Все свойства',
  'playground.allPropertiesNote': 'Полный набор API для всесторонней проверки.',
  'playground.noProperties': 'У этого примера нет настраиваемых свойств примитива.',

  'preview.return': 'Вернуться к документации компонента',
  'preview.label': 'Документация / детерминированный предпросмотр',
  'preview.notFoundCode': '404 / ПРЕДПРОСМОТР',
  'preview.notFound': 'Неизвестный пример компонента.',
  'preview.returnDocs': 'Вернуться к документации',

  'foundations.eyebrow': 'Основы',
  'foundations.heading': 'Семантическая система, а не набор красок.',
  'foundations.description':
    'KERN отделяет примитивы от продуктового смысла. Компоненты используют семантические роли, а приложение может безопасно менять тему, плотность, направление и фирменный цвет во время выполнения.',
  'foundations.parity': 'CSS и TypeScript согласованы',
  'foundations.themeStudio': 'СТУДИЯ ТЕМ',
  'foundations.calibrate': 'Настройте систему вживую.',
  'foundations.brandSource': 'Исходный фирменный цвет',
  'foundations.color': 'ЦВЕТ',
  'foundations.colorHeading': 'Смысл сохраняется в любой теме.',
  'foundations.colorDescription':
    'Каждый смысловой цвет имеет роли поверхности, границы, текста, заливки и текста на заливке. Цвет дополняется формой и подписью.',
  'foundations.type': 'ТИПОГРАФИКА',
  'foundations.typeHeading': 'IBM Plex, настроенный для плотных и ясных интерфейсов.',
  'foundations.typeDescription':
    'Согласованные IBM Plex Sans Condensed и Mono покрывают латиницу и кириллицу; моноширинные цифры используются для координат, токенов и операционных данных.',
  'foundations.displaySample': 'Точность без стерильности.',
  'foundations.bodySample':
    'Продуктовым интерфейсам нужен запас для нюансов: видимые подписи, выровненные числа и инструкции, работающие при увеличении до 200%.',
  'foundations.controlLabel': '07 / ПОДПИСЬ ЭЛЕМЕНТА',
  'foundations.spacing': 'ИНТЕРВАЛЫ + ПЛОТНОСТЬ',
  'foundations.spacingHeading': 'Базовая сетка 4 px с оптическими исключениями.',
  'foundations.spacingDescription':
    'Плотность меняет ритм элементов, но не размер текста. Для неточных указателей сохраняется минимальная цель 44 px.',
  'foundations.motion': 'АНИМАЦИЯ',
  'foundations.motionHeading': 'Анимация подтверждает геометрию и причину.',
  'foundations.motionDescription':
    'Длительности короткие, смещение остаётся в пределах двух–шести пикселей, а reduced motion убирает трансформации.',
  'foundations.tokenExplorer': 'КАТАЛОГ ТОКЕНОВ',
  'foundations.tokensHeading': 'типизированных публичных токенов.',
  'foundations.tokensDescription':
    'Один контракт доступен через CSS custom properties и TypeScript-объект krnTokens.',
  'foundations.tokenTable': 'Прокручиваемая таблица токенов',
  'foundations.group': 'Группа',
  'foundations.name': 'Название',
  'foundations.cssProperty': 'CSS custom property',

  'patterns.eyebrow': 'Паттерны',
  'patterns.heading': 'Продуктовые сценарии, собранные открыто.',
  'patterns.description':
    'Паттерны объединяют публичные примитивы, не скрывая продуктовых решений. Копируйте, адаптируйте и сохраняйте базовые контракты доступности.',
  'patterns.compositions': '15 композиций',
  'patterns.applicationFrame': 'КАРКАС ПРИЛОЖЕНИЯ',
  'patterns.applicationHeading': 'Операционная панель + мастер–детали.',
  'patterns.applicationDescription':
    'Выбор меняет контекст панели действий. В узких контейнерах двухколоночный макет превращается в переход список–детали.',
  'patterns.workspaceActions': 'Действия с рабочими пространствами',
  'patterns.workspaces': 'Рабочие пространства',
  'patterns.archive': 'Архивировать',
  'patterns.export': 'Экспортировать',
  'patterns.newWorkspace': 'Новое пространство',
  'patterns.backWorkspaces': '← Назад к рабочим пространствам',
  'patterns.workspace': 'РАБОЧЕЕ ПРОСТРАНСТВО',
  'patterns.workspaceDescription':
    'Разрешения, состояние автоматизации и контекст использования остаются доступны без выхода из списка.',
  'patterns.healthy': 'В норме',
  'patterns.attention': 'Требует внимания',
  'patterns.healthyDescription':
    'Все запланированные запуски завершились в пределах целевого времени.',
  'patterns.dashboard': 'ПАНЕЛЬ ПОКАЗАТЕЛЕЙ',
  'patterns.dashboardHeading': 'Виджеты с настоящей информационной иерархией.',
  'patterns.dashboardDescription':
    'Виджеты — не декоративные карточки: заголовок, данные, статус и действия остаются структурно согласованными.',
  'patterns.automation': 'АВТОМАТИЗАЦИЯ',
  'patterns.runs': 'Запуски по окружениям',
  'patterns.lastHours': 'Последние 24 часа',
  'patterns.notifications': 'УВЕДОМЛЕНИЯ',
  'patterns.needsAttention': 'Требует внимания',
  'patterns.recentEvents': 'Последние события',
  'patterns.multiStep': 'МНОГОШАГОВАЯ ФОРМА',
  'patterns.progressHeading': 'Прогресс с валидацией, без лишней церемонии.',
  'patterns.progressDescription':
    'Навигация показывает текущий шаг, завершённый путь, необязательные этапы и блокировку невалидных шагов.',
  'patterns.createWorkspace': 'Создать пространство',
  'patterns.step': 'ШАГ',
  'patterns.nameWorkspace': 'Назовите рабочее пространство',
  'patterns.nameWorkspaceDescription': 'Выберите название, понятное команде в журналах аудита.',
  'patterns.invite': 'Пригласите участников',
  'patterns.inviteDescription': 'Добавьте участников сейчас или пригласите их позже.',
  'patterns.reviewPolicy': 'Проверьте политику',
  'patterns.reviewDescription': 'Подтвердите доступ и хранение данных перед созданием.',
  'patterns.workspaceCreated': 'Рабочее пространство создано',
  'patterns.workspaceCreatedDescription': 'Паттерн отправил типизированное событие завершения.',
  'patterns.authProfile': 'ВХОД + ПРОФИЛЬ',
  'patterns.formsHeading': 'Типизированные формы с честными состояниями.',
  'patterns.formsDescription':
    'Состояния touched, invalid, dirty, loading, error и saved видны пользователям и вспомогательным технологиям.',
  'patterns.accountSignIn': 'АККАУНТ / ВХОД',
  'patterns.continue': 'Продолжить в KERN',
  'patterns.credentialsAccepted': 'Данные приняты',
  'patterns.settingsProfile': 'НАСТРОЙКИ / ПРОФИЛЬ',
  'patterns.publicProfile': 'Публичный профиль',
  'patterns.globalContext': 'ГЛОБАЛЬНЫЙ КОНТЕКСТ',
  'patterns.contextHeading': 'Меню пользователя и панель настроек.',
  'patterns.profile': 'Профиль',
  'patterns.workspaceSettings': 'Настройки пространства',
  'patterns.signOut': 'Выйти',
  'patterns.openSettings': 'Открыть настройки',
  'patterns.defaultExperience': 'Настройки по умолчанию',
  'patterns.workspaceName': 'Название пространства',
  'patterns.dataRegion': 'Регион данных',
  'patterns.eu': 'Европейский союз',
  'patterns.us': 'США',
  'patterns.requireSso': 'Требовать SSO для администраторов',
  'patterns.cancel': 'Отмена',
  'patterns.saveChanges': 'Сохранить изменения',
  'patterns.seatThreshold': 'Достигнут лимит мест',
  'patterns.seatThresholdDetail': 'Fieldnote использует 96% доступных мест.',
  'patterns.minutes8': '8 минут назад',
  'patterns.exportCompleted': 'Экспорт завершён',
  'patterns.exportCompletedDetail': 'Пакет аудита за третий квартал готов к скачиванию.',
  'patterns.minutes34': '34 минуты назад',
  'patterns.identity': 'Идентификация',
  'patterns.people': 'Участники',
  'patterns.collaborators': 'Совместная работа',
  'patterns.review': 'Проверка',
  'patterns.policy': 'Политика',
  'patterns.operationsLead': 'Руководитель операций',
  'patterns.profileBio': 'Создаёт спокойные системы для сложной работы.',

  'accessibility.eyebrow': 'Доступность',
  'accessibility.heading': 'WCAG 2.2 AA — это базовый уровень.',
  'accessibility.description':
    'KERN рассматривает семантику, клавиатуру, фокус, контраст, масштабирование, анимацию, RTL и устойчивый контент как единый контракт качества.',
  'accessibility.keyboardFirst': 'Сначала клавиатура',
  'accessibility.forcedColors': 'Принудительные цвета',
  'accessibility.principle': 'ПРИНЦИП',
  'accessibility.structure': 'Доступность через структуру, проверка через поведение.',
  'accessibility.notCertification': 'Автоматизация — не сертификация',
  'accessibility.alert':
    'axe находит важную часть проблем. KERN также проверяет порядок фокуса, объявления, клавиатурные сценарии, reflow, размеры целей и рендеринг в реальном браузере.',
  'accessibility.matrix': 'МАТРИЦА ПРОВЕРКИ',
  'accessibility.matrixHeading': 'Единая матрица приёмки для каждого стабильного компонента.',
  'accessibility.matrixDescription':
    'Все компоненты каталога объявляют ожидаемые визуальные и интерактивные состояния. Матрица — требование к релизу, но не утверждение, что для каждого состояния есть отдельный снимок или ручной сертификат.',
  'accessibility.matrixAria': 'Матрица проверки доступности',
  'accessibility.dimension': 'Измерение',
  'accessibility.repositoryEvidence': 'Проверки в репозитории',
  'accessibility.humanReview': 'Ручная проверка',
  'accessibility.keyboard': 'КЛАВИАТУРА',
  'accessibility.keyboardHeading': 'Составные виджеты имеют явные контракты.',
  'accessibility.reflow': 'REFLOW + КОНТРАСТ',
  'accessibility.reflowHeading': 'Проектируйте осмысленный reflow при 200%.',
  'accessibility.reflowDescription':
    'Логические свойства и container queries используются в реализации; адаптивные тесты проверяют узкие области и увеличенный текст. Высокая контрастность — структурная тема, а forced colors дополнительно проверяются в Windows.',
  'accessibility.light': 'Светлая',
  'accessibility.lightCopy': 'Текст остаётся спокойным и читаемым.',
  'accessibility.visibleLink': 'Заметная ссылка',
  'accessibility.dark': 'Тёмная',
  'accessibility.darkCopy': 'Углеродные поверхности сохраняют иерархию.',
  'accessibility.contrast': 'Высокая контрастность',
  'accessibility.contrastCopy': 'Структура не зависит от теней.',
  'accessibility.underlinedLink': 'Подчёркнутая ссылка',
  'accessibility.consumerRule': 'ПРАВИЛО ДЛЯ ПОТРЕБИТЕЛЯ',
  'accessibility.namesErrors': 'Оставляйте названия видимыми, а ошибки — конкретными.',
  'accessibility.semanticFoundation': 'Семантическая основа',
  'accessibility.semanticCopy':
    'Сначала используйте возможности платформы и добавляйте ARIA только там, где нативный HTML не выражает взаимодействие.',
  'accessibility.nativeControls': 'Нативные элементы управления',
  'accessibility.stableNames': 'Устойчивые доступные имена',
  'accessibility.liveRegions': 'Live regions для асинхронной обратной связи',
  'accessibility.keyboardContinuity': 'Непрерывность клавиатурного управления',
  'accessibility.keyboardCopy':
    'Порядок Tab следует визуальному порядку; составные виджеты используют roving focus и документированное управление стрелками.',
  'accessibility.escapeRestore': 'Закрытие по Escape и восстановление фокуса',
  'accessibility.noHoverOnly': 'Нет действий, доступных только по наведению',
  'accessibility.perceivableState': 'Воспринимаемое состояние',
  'accessibility.perceivableCopy':
    'Цвет никогда не является единственным сигналом. Текст, иконки, границы и объявления усиливают изменение.',
  'accessibility.aaTargets': 'Целевой контраст AA',
  'accessibility.statusIcon': 'Иконка статуса + подпись',
  'accessibility.forcedRoles': 'Системные роли forced colors',
  'accessibility.resilientContent': 'Устойчивый контент',
  'accessibility.resilientCopy':
    'Длинные переводы, узкие контейнеры, увеличение текста до 200%, RTL и reduced motion — обычные входные условия.',
  'accessibility.logicalProperties': 'Логические CSS-свойства',
  'accessibility.noOverflowFixes': 'Нет маскирующих overflow-исправлений',
  'accessibility.dimensionKeyboard': 'Клавиатура',
  'accessibility.keyboardAutomation': 'Unit-контракты + показательные сценарии Playwright',
  'accessibility.keyboardHuman': 'Порядок и обнаруживаемость',
  'accessibility.accessibleName': 'Доступное имя',
  'accessibility.clarityContext': 'Ясность в контексте',
  'accessibility.focus': 'Фокус',
  'accessibility.focusAssertions': 'Проверки фокуса',
  'accessibility.visibilityRestoration': 'Видимость и восстановление',
  'accessibility.contrastDimension': 'Контраст',
  'accessibility.contrastAutomation': 'axe + проверки тем и токенов',
  'accessibility.allThemes': 'Все продуктовые темы',
  'accessibility.zoomReflow': 'Масштаб / reflow',
  'accessibility.viewportSuite': 'Набор проверок при 200%',
  'accessibility.readingClipping': 'Порядок чтения и обрезка',
  'accessibility.motionDimension': 'Анимация',
  'accessibility.motionAutomation': 'Показательная эмуляция reduced motion',
  'accessibility.causalityComfort': 'Причинность и комфорт',
  'accessibility.directionMatrix': 'Показательная матрица направлений',
  'accessibility.iconMirroring': 'Осмысленное зеркалирование иконок',
  'accessibility.forcedAutomation': 'CSS-правила + сценарии высокой контрастности',
  'accessibility.windowsPass': 'Проверка Windows HC',
  'accessibility.moveTabs': 'Перемещение по горизонтальным вкладкам',
  'accessibility.jumpTabs': 'Переход к первой или последней доступной вкладке',
  'accessibility.moveOption': 'Перемещение активного варианта',
  'accessibility.commitSelection': 'Подтвердить выбор',
  'accessibility.closeFocus': 'Закрыть без перехвата фокуса',
  'accessibility.dataGrid': 'Сетка данных',
  'accessibility.arrowKeys': 'Клавиши со стрелками',
  'accessibility.moveCell': 'Перемещение активной ячейки',
  'accessibility.rowBoundary': 'Переход к границе строки',
  'accessibility.modalTrap': 'Оставаться внутри модальной ловушки фокуса',
  'accessibility.closeRestore': 'Закрыть и вернуть фокус триггеру',

  'changelog.eyebrow': 'История изменений',
  'changelog.heading': 'Каждый релиз документирован ясно.',
  'changelog.description':
    'KERN следует семантическому версионированию. Регрессии доступности и изменения публичного API описываются как продуктовые изменения, а не скрываются как детали реализации.',
  'changelog.version': 'Версия',
  'changelog.releaseHeading': 'Текущий релиз',
  'changelog.releaseState': 'Не опубликован',
  'changelog.releaseTitle': 'Кандидат исходного кода',
  'changelog.foundationThemes':
    'Светлая, тёмная, системная и высококонтрастная темы с генерацией фирменной палитры во время выполнения.',
  'changelog.foundationDensity': 'Компактная, обычная и просторная шкалы плотности.',
  'changelog.foundationTokens':
    'Типизированные токены, конфигурация приложения, русский и английский UI, RTL, анимация и forced colors.',
  'changelog.componentFamilies':
    'Семейства макета, действий, форм, навигации, оверлеев, обратной связи и отображения данных.',
  'changelog.componentCharts':
    'Доступные SVG-примитивы линейных, столбчатых и кольцевых диаграмм с резервной таблицей данных.',
  'changelog.componentGrid':
    'Сетка данных с сортировкой, фильтрацией, выбором, раскрытием, изменением размеров, пагинацией и виртуализацией.',
  'changelog.tooling': 'Инструменты',
  'changelog.toolingAngular': 'Angular 22 без Zone.js, строгий TypeScript и standalone-компоненты.',
  'changelog.toolingTests':
    'Unit-покрытие Vitest и проекты Playwright для доступности, адаптивности, клавиатуры и визуальных проверок.',
  'changelog.toolingSsr':
    'SSR-приложение документации со встроенным детерминированным playground компонентов.',
  'changelog.toolingSchematics':
    'Идемпотентные схемы установки и диагностики и публичная точка входа CDK component harness.',
  'changelog.toolingMetadata':
    'Сгенерированные runtime-метаданные API и курируемый статус жизненного цикла каждого компонента.',

  'grid.compositions': 'Композиции',
  'grid.heading': 'Data Grid в реальном продуктовом интерфейсе',
  'grid.description':
    'Типизированные колонки становятся продуктовым UI в композиции с идентификацией, статусами и элементами форм. Каждый пример использует настоящий API Data Grid и содержит отдельный готовый код.',
  'grid.ordersAria': 'Последние заказы клиентов',
  'grid.findOrder': 'Найти заказ или клиента',
  'grid.recentOrders': 'Последние заказы',
  'grid.ordersDescription':
    'Строки с поиском и сортировкой, идентификацией, статусом оплаты и выровненными суммами.',
  'grid.copyOrders': 'Копировать код примера последних заказов',
  'grid.copyCode': 'Копировать код',
  'grid.viewCode': 'Показать Angular-код',
  'grid.quantityFor': 'Количество для',
  'grid.editableAria': 'Редактируемое количество в заказе',
  'grid.total': 'Итого',
  'grid.editableOrder': 'Редактируемый заказ',
  'grid.editableDescription':
    'Пользовательская ячейка обновляет типизированные signal-данные и пересчитывает итог.',
  'grid.copyEditable': 'Копировать код примера редактируемого заказа',
  'grid.deliveryAria': 'Статус задач поставки',
  'grid.deliveryStatus': 'Статус поставки',
  'grid.deliveryDescription': 'Компактная сетка со спокойными и осмысленными статусами.',
  'grid.copyDelivery': 'Копировать код примера статусов поставки',
  'grid.order': 'Заказ',
  'grid.customer': 'Клиент',
  'grid.status': 'Статус',
  'grid.amount': 'Сумма',
  'grid.item': 'Товар',
  'grid.quantity': 'Количество',
  'grid.price': 'Цена',
  'grid.task': 'Задача',
  'grid.paid': 'Оплачен',
  'grid.pending': 'Ожидает',
  'grid.refunded': 'Возвращён',
  'grid.completed': 'Завершено',
  'grid.inProgress': 'В работе',
  'grid.designHomepage': 'Спроектировать главную страницу',
  'grid.implementApi': 'Реализовать API',
  'grid.writeTests': 'Написать тесты',
  'grid.itemAlpha': 'Товар «Альфа»',
  'grid.itemBeta': 'Товар «Бета»',
  'grid.itemGamma': 'Товар «Гамма»',
});

export const RU_CATEGORIES: Readonly<Record<KernCategory, string>> = Object.freeze({
  Layout: 'Макет',
  Actions: 'Действия',
  Forms: 'Формы',
  Navigation: 'Навигация',
  Feedback: 'Обратная связь',
  'Data display': 'Отображение данных',
  Patterns: 'Паттерны',
});

export const RU_STATUS: Readonly<Record<KernComponentStatus, string>> = Object.freeze({
  stable: 'стабильный',
  beta: 'бета',
  experimental: 'экспериментальный',
  recipe: 'рецепт',
  deprecated: 'устаревший',
});

export const RU_TERMS: Readonly<Record<string, string>> = Object.freeze({
  System: 'Системная',
  Light: 'Светлая',
  Dark: 'Тёмная',
  'High contrast': 'Высокая контрастность',
  Compact: 'Компактный',
  Comfortable: 'Обычный',
  Spacious: 'Просторный',
  Default: 'По умолчанию',
  Loading: 'Загрузка',
  Disabled: 'Отключён',
  Required: 'Обязательно',
  Invalid: 'Ошибка',
  Open: 'Открыт',
  Closed: 'Закрыт',
  Value: 'Значение',
  Size: 'Размер',
  Tone: 'Тон',
  Variant: 'Вариант',
  Appearance: 'Оформление',
  Orientation: 'Ориентация',
  Connected: 'Соединённый вид',
  Selection: 'Выбор',
  Selected: 'Выбран',
  Multiple: 'Множественный выбор',
  Filterable: 'Фильтрация',
  Resizable: 'Изменяемый размер',
  Sortable: 'Сортировка',
  Pagination: 'Пагинация',
  Interactive: 'Интерактивный',
  Minimum: 'Минимум',
  Maximum: 'Максимум',
  Partial: 'Частично',
  Mobile: 'Мобильный',
  Virtualized: 'Виртуализация',
  'Stress data': 'Нагрузочные данные',
  'Focus visible': 'Видимый фокус',
  'Interactive example': 'Интерактивный пример',
  Canvas: 'Холст',
  Surface: 'Поверхность',
  Raised: 'Приподнятая поверхность',
  Text: 'Текст',
  Primary: 'Основной',
  Success: 'Успех',
  Warning: 'Предупреждение',
  Danger: 'Опасность',
  Info: 'Информация',
  'hover / press': 'наведение / нажатие',
  'selection / disclosure': 'выбор / раскрытие',
  'overlay / dialog': 'оверлей / диалог',
  'page entrance': 'появление страницы',
});

export const RU_COMPONENT_SUMMARIES: Readonly<Record<string, string>> = Object.freeze({
  'app-shell':
    'Объединяет шапку, навигацию, боковую панель и основное содержимое на широких и узких экранах.',
  header:
    'Создаёт фиксированную или обычную шапку с настраиваемыми высотой, отступом и уровнем поверхности.',
  sidebar:
    'Создаёт сворачиваемую дополнительную панель, которую можно оставить в виде иконок или полностью скрыть.',
  'navigation-rail':
    'Создаёт компактную основную навигацию, раскрывающуюся из узкой панели в подписанный список.',
  container:
    'Ограничивает ширину содержимого, добавляет боковые поля и выравнивает блок внутри родителя.',
  stack: 'Располагает дочерние элементы вертикально с единым интервалом и выравниванием.',
  inline:
    'Располагает дочерние элементы горизонтально с интервалом, выравниванием и переносом строк.',
  cluster:
    'Переносит связанные элементы по строкам с независимыми горизонтальными и вертикальными интервалами.',
  grid: 'Создаёт фиксированные или автоматически заполняемые колонки и адаптирует их к узкому контейнеру.',
  'split-layout':
    'Размещает две панели в заданном соотношении и складывает их ниже контейнерной точки перелома.',
  center:
    'Центрирует дочернее содержимое в ограниченной по ширине области. В новом коде используйте Container с внутренним центрированием.',
  spacer: 'Резервирует декоративное место по горизонтали или вертикали и скрыт от скринридеров.',
  divider: 'Разделяет соседнее содержимое по горизонтали или вертикали и может содержать подпись.',
  'aspect-ratio': 'Сохраняет заданное соотношение сторон и управляет вписыванием медиа.',
  'scroll-area':
    'Ограничивает переполняющееся содержимое по выбранным осям и явно задаёт поведение полос прокрутки.',
  'responsive-show-hide':
    'Показывает или скрывает содержимое между адаптивными границами без его дублирования.',
  'resizable-panels':
    'Позволяет менять размеры соседних панелей мышью или клавиатурой в заданных пределах.',
  button:
    'Дополняет нативную кнопку визуальной иерархией KERN и состоянием загрузки без потери фокуса.',
  'icon-button':
    'Дополняет нативную кнопку компактной квадратной областью, обязательным доступным именем и загрузкой.',
  'button-group':
    'Подписывает и располагает независимые нативные действия, не управляя их фокусом или выбором.',
  'split-button': 'Объединяет основное действие и отдельное меню близких вторичных действий.',
  'floating-action-button':
    'Показывает одно приоритетное контекстное действие как компактную или расширенную плавающую кнопку.',
  'toggle-button': 'Добавляет одной нативной кнопке управляемое нажатое состояние и aria-pressed.',
  'toggle-group':
    'Координирует нажатые значения и перемещение фокуса в подписанной панели переключателей.',
  'copy-button':
    'Копирует заданное значение и сообщает об ожидании, успехе или ошибке, не перемещая фокус.',
  link: 'Оформляет нативную ссылку, сохраняя навигационную семантику браузера или Angular Router.',
  'dropdown-button': 'Открывает меню действий из одной подписанной нативной кнопки.',
  'form-field':
    'Связывает один элемент управления с видимой подписью, подсказкой, ошибкой и состоянием Angular Forms.',
  label: 'Даёт одному элементу формы видимое доступное имя и необязательный маркер обязательности.',
  hint: 'Добавляет пояснение, которое Form Field связывает со своим элементом управления.',
  'validation-message':
    'Показывает сообщение валидации и связывает его с соответствующим элементом формы.',
  'text-input': 'Принимает одну строку произвольного текста и работает с Angular Forms.',
  textarea:
    'Принимает многострочный текст с необязательной автоподстройкой высоты и счётчиком символов.',
  'password-input':
    'Принимает пароль и позволяет показать или скрыть значение локализованной кнопкой.',
  'search-input':
    'Принимает запрос, очищает его отдельным действием и отправляет явное событие поиска.',
  'number-input': 'Принимает числовое значение в заданных границах и может показывать кнопки шага.',
  checkbox:
    'Представляет независимый логический выбор и поддерживает отдельное неопределённое состояние.',
  'checkbox-group':
    'Объединяет независимые флажки общей подписью и координирует их состояние формы.',
  radio: 'Представляет один вариант внутри Radio Group, сохраняя нативную семантику радиокнопки.',
  'radio-group':
    'Разрешает выбрать один вариант из подписанной группы и управляет переходом стрелками.',
  switch: 'Немедленно включает или выключает настройку и показывает поясняющий текст.',
  select: 'Открывает оформленный список и выбирает одно значение из заранее заданных вариантов.',
  'native-select': 'Передаёт выбор одного заданного значения браузеру и операционной системе.',
  'multi-select': 'Выбирает несколько заданных значений и показывает их в компактном триггере.',
  combobox: 'Фильтрует заданный список и принимает значение только явно выбранного варианта.',
  autocomplete: 'Предлагает известные варианты, но сохраняет допустимый произвольный текст.',
  slider: 'Выбирает одно числовое значение в заданных пределах мышью, касанием или клавиатурой.',
  'range-slider':
    'Выбирает числовой интервал двумя независимо подписанными ползунками начала и конца.',
  'segmented-control':
    'Показывает небольшой взаимоисключающий набор режимов или представлений как соседние сегменты.',
  'date-picker': 'Выбирает одну дату в заданных границах из локализованного календаря.',
  'date-range-picker':
    'Выбирает упорядоченные начальную и конечную даты с учётом календарных ограничений.',
  'time-picker': 'Принимает точное время в 24-часовом формате и предлагает список частых значений.',
  'color-picker': 'Выбирает один цвет через доступную палитру и управляемое текстовое значение.',
  'file-upload':
    'Выбирает один или несколько файлов и сообщает об ограничениях типа, размера и количества.',
  'drag-drop-upload':
    'Показывает File Upload как область перетаскивания. В новом коде используйте File Upload с таким представлением.',
  'verification-code':
    'Принимает проверочный код фиксированной длины через согласованные редактируемые позиции.',
  'tags-input':
    'Добавляет и удаляет введённые пользователем текстовые значения с ограничениями количества и повторов.',
  breadcrumbs:
    'Показывает иерархию текущего расположения и сворачивает промежуточные пункты при нехватке места.',
  alert: 'Показывает встроенное статусное сообщение заданного тона с необязательным закрытием.',
  banner:
    'Показывает Alert как баннер на всю страницу. В новом коде используйте Alert с размещением banner.',
  toast: 'Ставит временные сообщения в очередь и управляет их положением и количеством.',
  tooltip: 'Показывает короткое пояснение при наведении или фокусе без новой точки Tab.',
  popover:
    'Открывает от своего триггера фокусируемую немодальную поверхность и предсказуемо её закрывает.',
  'hover-card':
    'Показывает расширенное немодальное превью, пока триггер находится под указателем или в фокусе.',
  dialog:
    'Открывает модальную или немодальную рабочую поверхность и восстанавливает фокус после закрытия.',
  'alert-dialog':
    'Запрашивает решение перед значимым действием и удерживает фокус внутри модальной поверхности.',
  drawer:
    'Открывает рабочую панель у края экрана с настраиваемыми модальностью, размером и возвратом фокуса.',
  'bottom-sheet':
    'Открывает рабочую поверхность у нижнего края, подходящую для компактных и сенсорных интерфейсов.',
  'loading-overlay':
    'Помечает область как занятую и при необходимости блокирует взаимодействие на время операции.',
  'progress-bar': 'Показывает известный или неопределённый прогресс на горизонтальной шкале.',
  'circular-progress':
    'Показывает известный или неопределённый прогресс компактным круговым индикатором.',
  spinner: 'Показывает продолжающуюся работу, когда полезный процент выполнения неизвестен.',
  skeleton: 'Сохраняет геометрию будущего содержимого неинтерактивной заглушкой загрузки.',
  'empty-state':
    'Объясняет отсутствие содержимого и при необходимости предлагает одно подходящее следующее действие.',
  tabs: 'Переключает связанные панели с одной выбранной вкладкой и клавиатурой по выбранной оси.',
  'vertical-tabs': 'Использует модель взаимодействия Tabs на вертикальной оси.',
  pagination:
    'Перемещает по ограниченному набору страниц и показывает текущую страницу с соседними.',
  stepper:
    'Показывает продвижение по упорядоченному процессу и может запрещать пропуск незавершённых шагов.',
  menu: 'Открывает временный список команд и закрывается после выбора или отмены.',
  menubar:
    'Показывает постоянные команды верхнего уровня с перемещаемым фокусом и вложенными меню.',
  'context-menu': 'Открывает команды выбранного объекта в точке вызова указателем или клавиатурой.',
  'tree-navigation':
    'Перемещает по иерархии назначений с раскрытием, выбором и одной управляемой точкой Tab.',
  'bottom-navigation':
    'Показывает небольшой набор основных назначений в удобной для касания нижней панели.',
  'command-palette': 'Ищет команды и запускает выбранный результат из модальной палитры.',
  'table-of-contents':
    'Перечисляет заголовки страницы и отмечает раздел, находящийся в области чтения.',
  'back-button': 'Даёт явно подписанную нативную ссылку на предыдущее расположение в продукте.',
  'skip-link':
    'Показывает клавиатурную ссылку для прямого переноса фокуса к основному содержимому.',
  tree: 'Показывает иерархические данные с раскрытием, выбором, поиском по вводу и одной точкой Tab.',
  'data-grid':
    'Создаёт интерактивную сетку со стабильными строками, виртуализацией, выбором и действиями в ячейках.',
  'error-state':
    'Показывает Empty State для неудачного результата. В новом коде используйте Empty State с видом error.',
  'success-state':
    'Показывает Empty State для успешного результата. В новом коде используйте Empty State с видом success.',
  'confirmation-pattern': 'Добавляет явное подтверждение перед значимым действием в продукте.',
  badge: 'Показывает компактные дополнительные данные или счётчик без интерактивного состояния.',
  'status-badge':
    'Показывает именованный статус предметной области согласованными текстом, формой и цветом.',
  chip: 'Показывает компактное значение, которое можно выбрать вне семантики варианта формы.',
  tag: 'Показывает компактную удаляемую метку для назначенного пользователем или системой значения.',
  avatar:
    'Представляет человека или объект изображением, запасными инициалами и необязательным статусом присутствия.',
  'avatar-group':
    'Перекрывает несколько аватаров и суммирует участников, не поместившихся в видимый предел.',
  card: 'Объединяет связанное содержимое и необязательные действия на одной ограниченной поверхности.',
  stat: 'Сочетает заметное значение с подписью, контекстом и необязательной динамикой.',
  'description-list':
    'Показывает пары терминов и описаний с адаптивной семантической группировкой.',
  list: 'Задаёт семантическую структуру и интервалы для связанной последовательности элементов.',
  'list-item':
    'Показывает одну структурированную строку списка с заголовком, пояснением и действиями.',
  accordion: 'Координирует раскрытие набора подписанных разделов.',
  disclosure:
    'Раскрывает или скрывает один раздел дополнительного содержимого по подписанному триггеру.',
  timeline: 'Упорядочивает датированные или последовательные события на общей визуальной оси.',
  'data-table':
    'Показывает структурированные строки для просмотра, сортировки, фильтрации и действий со строками.',
  'responsive-media':
    'Помещает медиа в обрезанную область с фиксированным соотношением сторон. В новом коде используйте Aspect Ratio.',
  calendar:
    'Показывает локализованный месяц и управляет фокусом и выбором даты в заданных границах.',
  'code-block':
    'Показывает выделяемый исходный код с указанием языка и необязательным копированием.',
  'json-view': 'Показывает JSON как сворачиваемое дерево с поиском и оформлением типов данных.',
  'keyboard-shortcut':
    'Показывает локализованную комбинацию клавиш, не назначая ей поведение активации.',
  meter:
    'Показывает измерение в известных границах и учитывает низкий, высокий и оптимальный диапазоны.',
  rating:
    'Принимает или показывает ограниченную порядковую оценку с управлением клавиатурой и указателем.',
  'line-chart':
    'Показывает изменение по упорядоченной оси и делает каждую точку доступной с клавиатуры.',
  'bar-chart': 'Сравнивает значения категорий и делает каждый столбец доступным с клавиатуры.',
  'donut-chart':
    'Показывает соотношение частей и целого с интерактивной легендой и доступной сводкой данных.',
  'page-header':
    'Объединяет контекст страницы, заголовок, описание, индекс и действия в одной области.',
  'user-menu': 'Объединяет данные пользователя с действиями аккаунта и сеанса во временном меню.',
  'notification-center':
    'Собирает недавние уведомления и показывает непрочитанное, пустое, загружаемое и ошибочное состояния.',
  'global-search': 'Ищет назначения и действия во всём продукте из единой командной поверхности.',
  'filter-bar':
    'Координирует видимые фильтры, их текущие значения и действия применения или очистки.',
  'settings-panel': 'Редактирует связанную группу настроек в закрываемой боковой панели.',
  'crud-toolbar':
    'Объединяет создание, поиск, фильтрацию, выбор представления и действия с записями коллекции.',
  'bulk-actions': 'Заменяет действия коллекции операциями над текущим набором выбранных записей.',
  'master-detail-layout': 'Координирует панели списка и деталей на широких и узких экранах.',
  'dashboard-widget':
    'Упаковывает показатель или визуализацию вместе с контекстом, состояниями и действиями.',
  'login-form':
    'Принимает учётные данные, показывает ошибки валидации и предоставляет восстановление доступа.',
  'profile-form': 'Редактирует основные поля профиля с валидацией и явным состоянием сохранения.',
  'multi-step-form': 'Координирует валидацию, прогресс и навигацию по многоэтапной форме.',
  'mobile-navigation':
    'Собирает основные назначения в компактную навигационную поверхность для узких экранов.',
  'responsive-application-shell':
    'Переключает навигацию и структуру содержимого приложения между широкими и узкими экранами.',
});

export type RussianComponentFamilyId =
  | 'layout-flow'
  | 'application-shells'
  | 'content-containers'
  | 'media-framing'
  | 'action-groups'
  | 'form-anatomy'
  | 'select-family'
  | 'file-inputs'
  | 'menu-surfaces'
  | 'notices'
  | 'contextual-overlays'
  | 'modal-surfaces'
  | 'progress-indicators'
  | 'states'
  | 'data-visualization'
  | 'disclosure-containers'
  | 'tree-experiences'
  | 'content-cards';

export interface RussianComponentFamilyMember {
  readonly role: string;
  readonly migration?: string;
}

export interface RussianComponentFamily {
  readonly name: string;
  readonly description: string;
  readonly members: Readonly<Record<string, RussianComponentFamilyMember>>;
}

export const RU_COMPONENT_FAMILIES: Readonly<
  Record<RussianComponentFamilyId, RussianComponentFamily>
> = Object.freeze({
  'layout-flow': {
    name: 'Одномерный макет',
    description: 'Примитивы одномерного макета различаются направлением и переносом.',
    members: {
      stack: { role: 'Вертикальный поток с единым интервалом по блочной оси.' },
      inline: { role: 'Горизонтальный поток для элементов, обычно остающихся в одной строке.' },
      cluster: {
        role: 'Переносящаяся горизонтальная группа с отдельными интервалами строк и колонок.',
      },
    },
  },
  'application-shells': {
    name: 'Каркасы приложения',
    description: 'Композиции уровня страницы для постоянной навигации и содержимого приложения.',
    members: {
      'app-shell': { role: 'Основной примитив каркаса приложения и его структурные слоты.' },
      'responsive-application-shell': {
        role: 'Рецепт, объединяющий примитивы каркаса в адаптивное поведение продукта.',
        migration: 'Собирайте адаптивную навигацию напрямую с помощью App Shell.',
      },
      'mobile-navigation': {
        role: 'Устаревший рецепт навигации для компактных экранов.',
        migration: 'Собирайте мобильную навигацию из App Shell и навигационных примитивов.',
      },
    },
  },
  'content-containers': {
    name: 'Контейнеры содержимого',
    description: 'Макет с ограниченной шириной и необязательным внутренним центрированием.',
    members: {
      container: {
        role: 'Основной API ширины, полей, выравнивания и внутреннего центрирования.',
      },
      center: {
        role: 'Устаревшая обёртка центрированного контейнера с сокращённым набором параметров.',
        migration:
          'Используйте Container и включите intrinsic, когда дочерние элементы нужно центрировать по горизонтали.',
      },
    },
  },
  'media-framing': {
    name: 'Обрамление медиа',
    description: 'Предсказуемо задаёт размер и обрезку медиа, не смешивая их с политикой макета.',
    members: {
      'aspect-ratio': {
        role: 'Универсальная рамка с сохранением пропорций для любого содержимого.',
      },
      'responsive-media': {
        role: 'Устаревшая медиа-обёртка с фиксированным соотношением сторон.',
        migration: 'Используйте Aspect Ratio для того же контракта сохранения пропорций.',
      },
    },
  },
  'action-groups': {
    name: 'Группы действий и выбора',
    description: 'Групповые элементы различаются владением состоянием и клавиатурным контрактом.',
    members: {
      'button-group': {
        role: 'Размещает независимые действия и не управляет состоянием выбора.',
      },
      'toggle-group': { role: 'Управляет набором кнопок с сохраняемым нажатым состоянием.' },
      'segmented-control': {
        role: 'Компактный элемент формы для одного взаимоисключающего значения.',
      },
      'radio-group': {
        role: 'Явный выбор в форме, где все доступные варианты остаются видимыми.',
      },
    },
  },
  'form-anatomy': {
    name: 'Анатомия поля формы',
    description: 'Составные части одного доступного поля, а не конкурирующие элементы ввода.',
    members: {
      'form-field': {
        role: 'Координирует элемент управления, подпись, пояснение и сообщения валидации.',
      },
      label: { role: 'Задаёт доступное имя поля и видимую подпись.' },
      hint: { role: 'Добавляет пояснение или ограничение, не связанное с ошибкой.' },
      'validation-message': {
        role: 'Сообщает об ошибке валидации и подсказывает способ исправления.',
      },
    },
  },
  'select-family': {
    name: 'Семейство выбора',
    description: 'Элементы выбора различаются источником вариантов, поиском и числом значений.',
    members: {
      select: { role: 'Оформленный одиночный выбор из заданного набора вариантов.' },
      'native-select': {
        role: 'Нативный одиночный выбор с поведением браузера и операционной системы.',
      },
      'multi-select': { role: 'Выбор нескольких значений из заданного набора.' },
      combobox: {
        role: 'Одиночный выбор с поиском, ограниченный заранее заданными вариантами.',
      },
      autocomplete: {
        role: 'Свободный текст с подсказками, допускающий новые пользовательские значения.',
      },
    },
  },
  'file-inputs': {
    name: 'Выбор файлов',
    description: 'Элементы получения файлов различаются основным способом ввода.',
    members: {
      'file-upload': {
        role: 'Обычный выбор файлов с краткой информацией о выбранных элементах.',
      },
      'drag-drop-upload': {
        role: 'Устаревшая обёртка File Upload в виде области перетаскивания.',
        migration: 'Используйте File Upload с presentation="dropzone".',
      },
    },
  },
  'menu-surfaces': {
    name: 'Меню команд',
    description: 'Наборы команд различаются способом открытия и моделью навигации.',
    members: {
      menu: { role: 'Временный список команд, открываемый явным триггером.' },
      menubar: { role: 'Постоянный горизонтальный корневой уровень связанных меню.' },
      'context-menu': { role: 'Контекстный список команд, открываемый в точке вызова.' },
    },
  },
  notices: {
    name: 'Статусные сообщения',
    description: 'Сообщения различаются размещением, длительностью и степенью прерывания.',
    members: {
      alert: { role: 'Встроенное сообщение, связанное с соседним содержимым или задачей.' },
      banner: {
        role: 'Устаревшее представление контракта Alert на всю ширину страницы.',
        migration: 'Используйте Alert с placement="banner".',
      },
      toast: { role: 'Временное непрерывающее сообщение о завершившемся событии.' },
    },
  },
  'contextual-overlays': {
    name: 'Контекстные оверлеи',
    description: 'Привязанные оверлеи различаются насыщенностью содержимого и интерактивностью.',
    members: {
      tooltip: { role: 'Короткая неинтерактивная подпись или пояснение.' },
      popover: { role: 'Интерактивное контекстное содержимое с явным закрытием.' },
      'hover-card': { role: 'Расширенное превью, открываемое наведением или фокусом.' },
    },
  },
  'modal-surfaces': {
    name: 'Модальные поверхности',
    description: 'Блокирующие оверлеи различаются срочностью, краем появления и контекстом экрана.',
    members: {
      dialog: { role: 'Общая модальная поверхность для задачи или изолированного содержимого.' },
      'alert-dialog': { role: 'Срочное решение, требующее явного подтверждения.' },
      drawer: { role: 'Панель для вторичной задачи, появляющаяся от края экрана.' },
      'bottom-sheet': { role: 'Нижняя поверхность, оптимизированная для компактных экранов.' },
      'settings-panel': {
        role: 'Устаревший рецепт Drawer с заранее собранным содержимым настроек.',
        migration: 'Собирайте Drawer с полями и действиями, специфичными для продукта.',
      },
    },
  },
  'progress-indicators': {
    name: 'Индикаторы прогресса',
    description: 'Индикаторы работы различаются геометрией и наличием известного прогресса.',
    members: {
      'progress-bar': { role: 'Линейный известный или неопределённый прогресс задачи.' },
      'circular-progress': {
        role: 'Компактный круговой прогресс, когда можно показать значение.',
      },
      spinner: { role: 'Неопределённая активность, когда полезного значения прогресса нет.' },
    },
  },
  states: {
    name: 'Состояния результата',
    description:
      'Результаты целой области различаются восстановлением и ожидаемым следующим действием.',
    members: {
      'empty-state': {
        role: 'Основная поверхность результата; kind выбирает семантику пустоты, ошибки или успеха.',
      },
      'error-state': {
        role: 'Устаревшая обёртка ошибочного состояния с объяснением сбоя и восстановления.',
        migration: 'Используйте Empty State с kind="error".',
      },
      'success-state': {
        role: 'Устаревшая обёртка успешного состояния с подтверждением и следующим шагом.',
        migration: 'Используйте Empty State с kind="success".',
      },
    },
  },
  'data-visualization': {
    name: 'Диаграммы',
    description:
      'Единый API Chart задаёт тип, а устаревшие обёртки описывают отдельные способы сравнения.',
    members: {
      'line-chart': {
        role: 'Показывает изменение или тенденцию по упорядоченному измерению.',
        migration: 'Используйте Chart с type="line".',
      },
      'bar-chart': {
        role: 'Сравнивает величины отдельных категорий.',
        migration: 'Используйте Chart с type="bar".',
      },
      'donut-chart': {
        role: 'Показывает компактное соотношение частей и целого.',
        migration: 'Используйте Chart с type="donut".',
      },
    },
  },
  'disclosure-containers': {
    name: 'Раскрываемые области',
    description: 'Постепенно раскрывают одну область или согласованный набор областей.',
    members: {
      disclosure: { role: 'Одна независимо раскрываемая область содержимого.' },
      accordion: { role: 'Согласованный набор связанных раскрываемых областей.' },
    },
  },
  'tree-experiences': {
    name: 'Иерархические интерфейсы',
    description: 'Иерархии различаются тем, представляют ли узлы назначения или данные.',
    members: {
      'tree-navigation': { role: 'Иерархия навигационных назначений.' },
      tree: { role: 'Иерархические данные с выбором и раскрытием узлов.' },
    },
  },
  'content-cards': {
    name: 'Карточки содержимого',
    description: 'Ограниченные поверхности содержимого разных уровней продуктовой композиции.',
    members: {
      card: { role: 'Универсальный контейнер содержимого без правил конкретного дашборда.' },
      'dashboard-widget': {
        role: 'Устаревший рецепт показателя, действий и раскладки дашборда.',
        migration: 'Собирайте Card как именованную область с содержимым конкретного продукта.',
      },
    },
  },
});

export const RU_STATUS_DESCRIPTIONS: Readonly<Record<KernComponentStatus, string>> = Object.freeze({
  stable:
    'Поддерживаемый контракт, к которому применяется документированная политика совместимости.',
  beta: 'Доступен для контролируемой производственной оценки; контракт ещё может уточняться.',
  experimental: 'Ранний контракт, который может измениться в минорном релизе до 1.0.',
  recipe: 'Адаптируемая композиция, а не закрытый примитив.',
  deprecated: 'Временно поддерживается вместе с документированной заменой.',
});
