import { DOCUMENT, Location, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { KernCatalogItem } from '@kern-ui/showcase';
import {
  KernComponentSpecimen,
  findKernPlaygroundDefinition,
  type KernPlaygroundControl,
  type KernPlaygroundEnvironment,
  type KernPlaygroundStatePreset,
  type KernPlaygroundValue,
  type KernPlaygroundValues,
  type KernSpecimenScenario,
  normalizeKernPlaygroundValues,
  resolveKernPlaygroundState,
} from '@kern-ui/showcase/specimen';
import {
  KRN_LOCALE,
  KRN_LOCALE_PACKS,
  KRN_TRANSLATIONS,
  KrnThemeDirective,
} from '@kern-ui/angular/core';
import { KrnCodeBlock, KrnCopyButton } from '@kern-ui/angular/kit';

import type { DocsDensity } from '../preferences';

type PreviewTheme = 'system' | 'light' | 'dark' | 'high-contrast';
type PreviewDirection = 'ltr' | 'rtl';
type PreviewLocale = 'en-US' | 'ru-RU';
type PreviewMotion = 'system' | 'reduce' | 'full';
type PreviewViewport = 'responsive' | 'phone' | 'tablet';
type EnvironmentKey =
  'theme' | 'density' | 'direction' | 'locale' | 'motion' | 'viewport' | 'scenario';

const THEMES: readonly PreviewTheme[] = ['system', 'light', 'dark', 'high-contrast'];
const DENSITIES: readonly DocsDensity[] = ['compact', 'comfortable', 'spacious'];
const DIRECTIONS: readonly PreviewDirection[] = ['ltr', 'rtl'];
const LOCALES: readonly PreviewLocale[] = ['en-US', 'ru-RU'];
const MOTIONS: readonly PreviewMotion[] = ['system', 'reduce', 'full'];
const VIEWPORTS: readonly PreviewViewport[] = ['responsive', 'phone', 'tablet'];
const DEFAULT_BRAND_COLOR = '#4666da';
const ENVIRONMENT_DEFAULTS = {
  theme: 'system',
  density: 'comfortable',
  direction: 'ltr',
  locale: 'en-US',
  motion: 'system',
  brandColor: DEFAULT_BRAND_COLOR,
  viewport: 'responsive',
  scenario: 'default',
} as const;

function includesValue<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && values.includes(value as T);
}

function readSelect(event: Event): string {
  return (event.currentTarget as HTMLSelectElement).value;
}

function readInput(event: Event): string {
  return (event.currentTarget as HTMLInputElement).value;
}

function readChecked(event: Event): boolean {
  return (event.currentTarget as HTMLInputElement).checked;
}

function serializePlaygroundValue(value: KernPlaygroundValue): string {
  if (value === null) return 'null';
  return typeof value === 'string' ? value : String(value);
}

function normalizeBrandColor(value: string | null): string {
  return value && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_BRAND_COLOR;
}

function sameQuery(
  left: Readonly<Record<string, string>>,
  right: Readonly<Record<string, string>>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key])
  );
}

function owns(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function enforceComponentConstraints(
  componentId: string,
  values: KernPlaygroundValues,
): KernPlaygroundValues {
  if (
    componentId === 'data-grid' &&
    values['virtualize'] === true &&
    values['expandable'] === true
  ) {
    return Object.freeze({ ...values, expandable: false });
  }
  return values;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function angularLiteral(value: KernPlaygroundValue): string {
  if (value === null) return 'null';
  if (typeof value !== 'string') return String(value);
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

function materializePublicBindings(
  source: string,
  selector: string,
  controls: readonly KernPlaygroundControl[],
  args: KernPlaygroundValues,
): string {
  const publicControls = controls.filter(
    (control) =>
      (control.binding.kind === 'input' || control.binding.kind === 'model') &&
      !Object.is(args[control.key], control.defaultValue),
  );
  if (publicControls.length === 0) return source;

  const openingTagPattern = new RegExp(`<${escapeRegExp(selector)}\\b[^>]*>`);
  const openingTag = source.match(openingTagPattern)?.[0];
  if (!openingTag) return source;

  const prefix = `<${selector}`;
  const selfClosing = /\/\s*>$/.test(openingTag);
  let attributes = openingTag.slice(prefix.length, -1).replace(/\/\s*$/, '');
  const bindings: string[] = [];

  for (const control of publicControls) {
    const binding = control.binding;
    if (binding.kind !== 'input' && binding.kind !== 'model') continue;
    const publicName = binding.publicName;
    const escapedName = escapeRegExp(publicName);
    for (const pattern of [
      new RegExp(`\\s+\\[\\(${escapedName}\\)\\]\\s*=\\s*\"[^\"]*\"`, 'g'),
      new RegExp(`\\s+\\[${escapedName}\\]\\s*=\\s*\"[^\"]*\"`, 'g'),
      new RegExp(`\\s+${escapedName}\\s*=\\s*\"[^\"]*\"`, 'g'),
      new RegExp(`\\s+${escapedName}(?=\\s|$)`, 'g'),
    ]) {
      attributes = attributes.replace(pattern, '');
    }
    bindings.push(`[${publicName}]="${angularLiteral(args[control.key] ?? control.defaultValue)}"`);
  }

  const configuredOpeningTag =
    `${prefix}${attributes.trimEnd()} ${bindings.join(' ')}` + (selfClosing ? ' />' : '>');
  return source.replace(openingTagPattern, configuredOpeningTag);
}

const PREVIEW_SPECIMEN_TEMPLATE = `
  <kshow-component-specimen
    [item]="item()"
    [scenario]="scenario()"
    [state]="state()"
    [args]="args()"
    [resetRevision]="resetRevision()"
  />
`;

@Component({
  selector: 'kdocs-preview-fixture-en',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KernComponentSpecimen],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' },
    { provide: KRN_LOCALE, useValue: 'en-US' },
    { provide: KRN_TRANSLATIONS, useValue: KRN_LOCALE_PACKS['en-US'].translations },
  ],
  template: PREVIEW_SPECIMEN_TEMPLATE,
})
export class PreviewFixtureEn {
  readonly item = input.required<KernCatalogItem>();
  readonly scenario = input.required<KernSpecimenScenario>();
  readonly state = input.required<string>();
  readonly args = input.required<KernPlaygroundValues>();
  readonly resetRevision = input.required<number>();
}

@Component({
  selector: 'kdocs-preview-fixture-ru',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KernComponentSpecimen],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: KRN_LOCALE, useValue: 'ru-RU' },
    { provide: KRN_TRANSLATIONS, useValue: KRN_LOCALE_PACKS['ru-RU'].translations },
  ],
  template: PREVIEW_SPECIMEN_TEMPLATE,
})
export class PreviewFixtureRu {
  readonly item = input.required<KernCatalogItem>();
  readonly scenario = input.required<KernSpecimenScenario>();
  readonly state = input.required<string>();
  readonly args = input.required<KernPlaygroundValues>();
  readonly resetRevision = input.required<number>();
}

@Component({
  selector: 'kdocs-preview-fixture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviewFixtureEn, PreviewFixtureRu],
  template: `
    @if (locale() === 'ru-RU') {
      <kdocs-preview-fixture-ru
        [item]="item()"
        [scenario]="scenario()"
        [state]="state()"
        [args]="args()"
        [resetRevision]="resetRevision()"
      />
    } @else {
      <kdocs-preview-fixture-en
        [item]="item()"
        [scenario]="scenario()"
        [state]="state()"
        [args]="args()"
        [resetRevision]="resetRevision()"
      />
    }
  `,
})
export class PreviewFixture {
  readonly item = input.required<KernCatalogItem>();
  readonly scenario = input.required<KernSpecimenScenario>();
  readonly state = input.required<string>();
  readonly args = input.required<KernPlaygroundValues>();
  readonly locale = input.required<PreviewLocale>();
  readonly resetRevision = input.required<number>();
}

@Component({
  selector: 'kdocs-component-playground',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviewFixture, RouterLink, KrnThemeDirective, KrnCodeBlock, KrnCopyButton],
  template: `
    <section
      class="workbench"
      [class.workbench-isolated]="isolated()"
      [attr.data-playground-component]="item().id"
      aria-labelledby="playground-heading"
    >
      <header class="workbench-toolbar">
        <div class="workbench-title">
          <p>Interactive playground</p>
          <h2 id="playground-heading">Configure {{ item().name }}.</h2>
          <span>Every selection is reflected in the URL and can be shared or replayed.</span>
        </div>

        <div class="toolbar-actions">
          <div class="view-tabs" role="group" aria-label="Example view">
            <button
              type="button"
              [attr.aria-pressed]="activeTab() === 'preview'"
              aria-controls="preview-panel"
              (click)="activeTab.set('preview')"
            >
              Preview
            </button>
            <button
              type="button"
              [attr.aria-pressed]="activeTab() === 'code'"
              aria-controls="code-panel"
              (click)="activeTab.set('code')"
            >
              Code
            </button>
          </div>
          @if (!isolated()) {
            <a
              class="canvas-link"
              data-testid="open-isolated-preview"
              [routerLink]="['/preview', item().id]"
              [queryParams]="previewQuery()"
            >
              Open canvas
            </a>
          }
          <button class="reset-button" type="button" (click)="reset()">Reset</button>
          <krn-copy-button [value]="shareUrl()">Copy link</krn-copy-button>
        </div>
      </header>

      <div class="environment-controls" data-testid="preview-controls">
        <label>
          <span>Theme</span>
          <select
            data-testid="theme-control"
            aria-label="Preview theme"
            [value]="theme()"
            (change)="setEnvironment('theme', $event)"
          >
            @for (option of themes; track option) {
              <option [value]="option" [attr.selected]="theme() === option ? '' : null">
                {{ environmentLabel(option) }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Density</span>
          <select
            data-testid="density-control"
            aria-label="Preview density"
            [value]="density()"
            (change)="setEnvironment('density', $event)"
          >
            @for (option of densities; track option) {
              <option [value]="option" [attr.selected]="density() === option ? '' : null">
                {{ environmentLabel(option) }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Direction</span>
          <select
            data-testid="direction-control"
            aria-label="Preview direction"
            [value]="direction()"
            (change)="setEnvironment('direction', $event)"
          >
            @for (option of directions; track option) {
              <option [value]="option" [attr.selected]="direction() === option ? '' : null">
                {{ option.toUpperCase() }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Locale</span>
          <select
            data-testid="locale-control"
            aria-label="Preview locale"
            [value]="locale()"
            (change)="setEnvironment('locale', $event)"
          >
            @for (option of locales; track option) {
              <option [value]="option" [attr.selected]="locale() === option ? '' : null">
                {{ option }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Motion tokens</span>
          <select
            data-testid="motion-control"
            aria-label="Preview motion tokens"
            [value]="motion()"
            (change)="setEnvironment('motion', $event)"
          >
            @for (option of motions; track option) {
              <option [value]="option" [attr.selected]="motion() === option ? '' : null">
                {{ environmentLabel(option) }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Brand</span>
          <input
            type="color"
            data-testid="brand-color-control"
            aria-label="Preview brand color"
            [value]="brandColor()"
            (change)="setBrandColor($event)"
          />
        </label>

        <label>
          <span>Canvas</span>
          <select
            data-testid="viewport-control"
            aria-label="Preview canvas width"
            [value]="viewport()"
            (change)="setEnvironment('viewport', $event)"
          >
            @for (option of viewports; track option) {
              <option [value]="option" [attr.selected]="viewport() === option ? '' : null">
                {{ environmentLabel(option) }}
              </option>
            }
          </select>
        </label>

        <label>
          <span>Scenario</span>
          <select
            data-testid="scenario-control"
            aria-label="Preview scenario"
            [value]="scenario()"
            (change)="setEnvironment('scenario', $event)"
          >
            @for (option of scenarios(); track option) {
              <option [value]="option" [attr.selected]="scenario() === option ? '' : null">
                {{ environmentLabel(option) }}
              </option>
            }
          </select>
        </label>
      </div>

      <div class="state-presets" aria-labelledby="state-presets-label">
        <div>
          <span id="state-presets-label">States</span>
          <small>{{ presets().length }} executable presets</small>
        </div>
        <div class="state-scroll">
          @for (preset of presets(); track preset.id) {
            <button
              type="button"
              [attr.aria-pressed]="state() === preset.id"
              [attr.title]="presetDescription(preset)"
              (click)="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      </div>

      @if (controls().length > 0) {
        <section class="property-panel" aria-labelledby="property-heading">
          <header>
            <span>Properties</span>
            <strong id="property-heading">Live component parameters</strong>
            <small>{{ controls().length }} interactive controls</small>
          </header>
          <div class="property-grid">
            @for (control of controls(); track control.key) {
              <label
                [attr.title]="control.description"
                [attr.data-control-key]="control.key"
                [attr.data-binding-kind]="control.binding.kind"
              >
                <span>
                  <strong>{{ control.label }}</strong>
                  <code>{{ control.key }}</code>
                  <small>{{ control.description }}</small>
                  <em [attr.data-binding-kind]="control.binding.kind">
                    {{ bindingLabel(control) }}
                  </em>
                </span>

                @switch (control.kind) {
                  @case ('boolean') {
                    <input
                      type="checkbox"
                      [attr.aria-label]="control.label"
                      [checked]="booleanArg(control)"
                      [attr.checked]="booleanArg(control) ? '' : null"
                      (change)="setBooleanArg(control, $event)"
                    />
                  }
                  @case ('select') {
                    <select
                      [attr.aria-label]="control.label"
                      [value]="stringArg(control)"
                      (change)="setStringArg(control, $event)"
                    >
                      @for (option of control.options ?? []; track option.value) {
                        <option
                          [value]="serializedValue(option.value)"
                          [attr.selected]="optionSelected(control, option.value) ? '' : null"
                        >
                          {{ option.label }}
                        </option>
                      }
                    </select>
                  }
                  @case ('number') {
                    <input
                      type="number"
                      [attr.aria-label]="control.label"
                      [min]="control.min ?? null"
                      [max]="control.max ?? null"
                      [step]="control.step ?? 1"
                      [value]="numberArg(control)"
                      (change)="setNumberArg(control, $event)"
                    />
                  }
                  @case ('range') {
                    <span class="range-control">
                      <input
                        type="range"
                        [attr.aria-label]="control.label"
                        [min]="control.min ?? 0"
                        [max]="control.max ?? 100"
                        [step]="control.step ?? 1"
                        [value]="numberArg(control)"
                        (input)="setNumberArg(control, $event)"
                      />
                      <output>{{ numberArg(control) }}</output>
                    </span>
                  }
                  @default {
                    <input
                      type="text"
                      [attr.aria-label]="control.label"
                      [value]="stringArg(control)"
                      (change)="setStringArg(control, $event)"
                    />
                  }
                }
              </label>
            }
          </div>
        </section>
      } @else {
        <p class="fixture-note">
          This composition is controlled through named scenarios and acceptance-state presets;
          complex templates and data remain deterministic.
        </p>
      }

      <div
        id="preview-panel"
        class="preview-panel"
        [hidden]="activeTab() !== 'preview'"
        [attr.data-viewport]="viewport()"
      >
        <div
          class="preview-stage"
          data-testid="specimen-stage"
          [krnTheme]="theme()"
          [krnDensity]="density()"
          [krnBrandColor]="brandColor()"
          [attr.dir]="direction()"
          [attr.lang]="locale()"
          [attr.data-krn-motion]="motion()"
          [attr.data-state]="state()"
        >
          <div class="preview-ruler" aria-hidden="true">
            <span>{{ viewportLabel() }}</span>
            <span>{{ theme() }} / {{ density() }} / {{ direction().toUpperCase() }}</span>
          </div>
          <div class="preview-canvas">
            <kdocs-preview-fixture
              [item]="item()"
              [scenario]="scenario()"
              [state]="state()"
              [args]="args()"
              [locale]="locale()"
              [resetRevision]="resetRevision()"
            />
          </div>
          <div data-krn-preview-overlay-host></div>
        </div>
      </div>

      <div
        id="code-panel"
        class="code-panel"
        aria-label="Angular code example"
        [hidden]="activeTab() !== 'code'"
        [krnTheme]="theme()"
        [krnDensity]="density()"
        [krnBrandColor]="brandColor()"
        [attr.dir]="direction()"
        [attr.lang]="locale()"
        [attr.data-krn-motion]="motion()"
      >
        <div class="code-intro">
          <div>
            <span>Replayable configured example</span>
            <strong
              >Public primitive bindings replay the canvas; the generated base scaffold is
              strict-AOT verified against the npm artifact.</strong
            >
          </div>
          <krn-copy-button [value]="configuredCode()">Copy configured example</krn-copy-button>
        </div>
        <krn-code-block language="typescript" [code]="configuredCode()" />
      </div>
    </section>
  `,
  styleUrl: './component-playground.css',
})
export class ComponentPlayground {
  readonly item = input.required<KernCatalogItem>();
  readonly code = input.required<string>();
  readonly isolated = input(false);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly activeTab = signal<'preview' | 'code'>('preview');
  protected readonly resetRevision = signal(0);
  protected readonly themes = THEMES;
  protected readonly densities = DENSITIES;
  protected readonly directions = DIRECTIONS;
  protected readonly locales = LOCALES;
  protected readonly motions = MOTIONS;
  protected readonly viewports = VIEWPORTS;
  protected readonly definition = computed(() => {
    const definition = findKernPlaygroundDefinition(this.item().id);
    if (!definition) {
      throw new Error(`Missing playground definition for "${this.item().id}".`);
    }
    return definition;
  });
  protected readonly controls = computed(() => this.definition().controls);
  protected readonly presets = computed(() => this.definition().presets);
  protected readonly scenarios = computed<readonly KernSpecimenScenario[]>(
    () => this.definition().scenarios,
  );
  protected readonly state = computed(() => {
    const requested = this.queryParams().get('state');
    return requested && this.definition().states.includes(requested) ? requested : 'default';
  });
  private readonly selectedPreset = computed(
    () =>
      this.presets().find(({ id }) => id === this.state()) ??
      this.presets().find(({ id }) => id === 'default') ??
      this.presets()[0],
  );
  private readonly requestedTheme = computed<PreviewTheme>(() => {
    const value = this.queryParams().get('theme');
    return includesValue(THEMES, value) ? value : 'system';
  });
  private readonly requestedDensity = computed<DocsDensity>(() => {
    const value = this.queryParams().get('density');
    return includesValue(DENSITIES, value) ? value : 'comfortable';
  });
  private readonly requestedDirection = computed<PreviewDirection>(() => {
    const value = this.queryParams().get('direction');
    return includesValue(DIRECTIONS, value) ? value : 'ltr';
  });
  protected readonly locale = computed<PreviewLocale>(() => {
    const value = this.queryParams().get('locale');
    return includesValue(LOCALES, value) ? value : 'en-US';
  });
  protected readonly motion = computed<PreviewMotion>(() => {
    const value = this.queryParams().get('motion');
    return includesValue(MOTIONS, value) ? value : 'system';
  });
  protected readonly brandColor = computed(() =>
    normalizeBrandColor(this.queryParams().get('brandColor')),
  );
  private readonly requestedViewport = computed<PreviewViewport>(() => {
    const value = this.queryParams().get('viewport');
    return includesValue(VIEWPORTS, value) ? value : 'responsive';
  });
  private readonly requestedScenario = computed<KernSpecimenScenario>(() => {
    const value = this.queryParams().get('scenario');
    return includesValue(this.scenarios(), value) ? value : 'default';
  });
  private readonly requestedArgs = computed<KernPlaygroundValues>(() => {
    const params = this.queryParams();
    return enforceComponentConstraints(
      this.item().id,
      normalizeKernPlaygroundValues(
        this.definition(),
        Object.fromEntries(
          this.controls().map((control) => [
            control.key,
            this.parseControlValue(control, params.get(`arg.${control.key}`)),
          ]),
        ),
      ),
    );
  });
  private readonly resolvedState = computed(() =>
    resolveKernPlaygroundState(this.definition(), {
      state: this.state(),
      scenario: this.requestedScenario(),
      args: this.requestedArgs(),
    }),
  );
  protected readonly theme = computed<PreviewTheme>(
    () => this.resolvedState().environment.theme ?? this.requestedTheme(),
  );
  protected readonly density = computed<DocsDensity>(
    () => this.resolvedState().environment.density ?? this.requestedDensity(),
  );
  protected readonly direction = computed<PreviewDirection>(
    () => this.resolvedState().environment.direction ?? this.requestedDirection(),
  );
  protected readonly viewport = computed<PreviewViewport>(
    () => this.resolvedState().environment.viewport ?? this.requestedViewport(),
  );
  protected readonly scenario = computed<KernSpecimenScenario>(() => this.resolvedState().scenario);
  protected readonly args = computed<KernPlaygroundValues>(() => this.resolvedState().args);
  protected readonly shareUrl = computed(() => {
    const relative = this.router.serializeUrl(
      this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: this.canonicalQuery(),
      }),
    );
    if (!this.browser) return relative;
    const external = this.location.prepareExternalUrl(relative);
    return new URL(external, this.document.baseURI).href;
  });
  protected readonly configuredCode = computed(() => {
    const fixtureEffect = this.resolvedState().fixtureEffect;
    const materializedCode = materializePublicBindings(
      this.code(),
      this.item().selector,
      this.controls(),
      this.args(),
    );
    const snapshot = [
      `// KERN preview: ${this.theme()} theme · ${this.density()} density · ${this.direction().toUpperCase()} · ${this.locale()}`,
      `// Motion tokens: ${this.motion()} · Brand: ${this.brandColor()} · Canvas: ${this.viewport()}`,
      `// Scenario: ${this.scenario()} · State: ${this.state()}`,
    ];
    if (fixtureEffect) {
      snapshot.push(
        `// Documentation fixture: ${fixtureEffect.kind}/${fixtureEffect.mode} — ${fixtureEffect.description}`,
      );
    }
    const changed = this.controls().filter(
      (control) => !Object.is(this.args()[control.key], control.defaultValue),
    );
    if (changed.length > 0) {
      snapshot.push('// Preview controls:');
      for (const control of changed) {
        snapshot.push(
          `//   ${control.key} (${this.bindingLabel(control)}) = ${JSON.stringify(
            this.args()[control.key],
          )}`,
        );
      }
    }
    return `${snapshot.join('\n')}\n${materializedCode}`;
  });
  protected readonly previewQuery = computed(() => this.canonicalQuery());

  constructor() {
    effect(() => {
      this.item().id;
      this.activeTab.set('preview');
    });

    effect(() => {
      this.item().id;
      if (!this.browser) return;
      const current = Object.fromEntries(
        this.queryParams().keys.map((key) => [key, this.queryParams().get(key) ?? '']),
      );
      const canonical = this.canonicalQuery();
      if (!sameQuery(current, canonical)) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: canonical,
          replaceUrl: true,
        });
      }
    });
  }

  protected environmentLabel(value: string): string {
    if (value === 'high-contrast') return 'High contrast';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  protected viewportLabel(): string {
    return {
      responsive: 'Fluid canvas',
      phone: '390 px',
      tablet: '768 px',
    }[this.viewport()];
  }

  protected setEnvironment(key: EnvironmentKey, event: Event): void {
    const query: Record<string, string | null> = { [key]: readSelect(event) };
    const preset = this.selectedPreset();
    const environmentKey = key as keyof KernPlaygroundEnvironment;
    if (
      preset &&
      ((key === 'scenario' && preset.scenario !== 'default') ||
        (key !== 'scenario' && key !== 'locale' && owns(preset.environment ?? {}, environmentKey)))
    ) {
      query['state'] = null;
    }
    this.updateQuery(query);
  }

  protected setBrandColor(event: Event): void {
    this.updateQuery({ brandColor: readInput(event) });
  }

  protected applyPreset(preset: KernPlaygroundStatePreset): void {
    this.updateQuery({ state: preset.id === 'default' ? null : preset.id });
  }

  protected presetDescription(preset: KernPlaygroundStatePreset): string {
    const effects = [
      preset.scenario !== 'default' ? `scenario: ${preset.scenario}` : '',
      ...Object.entries(preset.environment ?? {}).map(([key, value]) => `${key}: ${value}`),
      ...Object.entries(preset.args).map(([key, value]) => `${key}: ${String(value)}`),
      preset.visualPseudoState ? `visual state: ${preset.visualPseudoState}` : '',
      preset.fixtureEffect
        ? `documentation fixture: ${preset.fixtureEffect.kind}/${preset.fixtureEffect.mode}`
        : '',
    ].filter(Boolean);
    return effects.length > 0 ? `${preset.label} — ${effects.join(', ')}` : preset.label;
  }

  protected bindingLabel(control: KernPlaygroundControl): string {
    const binding = control.binding;
    if (binding.kind === 'input') return `Public input: ${binding.publicName}`;
    if (binding.kind === 'model') return `Public model: ${binding.publicName}`;
    if (binding.kind === 'fixture') return `Preview fixture: ${binding.target}`;
    return 'Preview composition';
  }

  protected booleanArg(control: KernPlaygroundControl): boolean {
    return this.args()[control.key] === true;
  }

  protected optionSelected(control: KernPlaygroundControl, option: KernPlaygroundValue): boolean {
    return Object.is(this.args()[control.key], option);
  }

  protected stringArg(control: KernPlaygroundControl): string {
    return serializePlaygroundValue(this.args()[control.key] ?? control.defaultValue);
  }

  protected serializedValue(value: KernPlaygroundValue): string {
    return serializePlaygroundValue(value);
  }

  protected numberArg(control: KernPlaygroundControl): number {
    const value = this.args()[control.key];
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  protected setBooleanArg(control: KernPlaygroundControl, event: Event): void {
    this.setArg(control, readChecked(event));
  }

  protected setStringArg(control: KernPlaygroundControl, event: Event): void {
    this.setArg(control, this.parseControlValue(control, readInput(event)));
  }

  protected setNumberArg(control: KernPlaygroundControl, event: Event): void {
    this.setArg(control, Number(readInput(event)), event.type === 'input');
  }

  protected reset(): void {
    this.resetRevision.update((revision) => revision + 1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private setArg(
    control: KernPlaygroundControl,
    value: KernPlaygroundValue,
    replaceUrl = false,
  ): void {
    const queryValue = Object.is(value, control.defaultValue)
      ? null
      : serializePlaygroundValue(value);
    const query: Record<string, string | null> = { [`arg.${control.key}`]: queryValue };
    if (this.item().id === 'data-grid' && control.key === 'expandable' && value === true) {
      query['arg.virtualize'] = null;
    }
    if (owns(this.selectedPreset()?.args ?? {}, control.key)) {
      query['state'] = null;
    }
    this.updateQuery(query, replaceUrl);
  }

  private updateQuery(values: Record<string, string | null>, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.canonicalQuery(values),
      replaceUrl,
    });
  }

  private canonicalQuery(
    overrides: Readonly<Record<string, string | null>> = {},
  ): Record<string, string> {
    const source = Object.fromEntries(
      this.queryParams().keys.map((key) => [key, this.queryParams().get(key)]),
    );
    Object.assign(source, overrides);
    const query: Record<string, string> = {};

    const theme = includesValue(THEMES, source['theme'])
      ? source['theme']
      : ENVIRONMENT_DEFAULTS.theme;
    const density = includesValue(DENSITIES, source['density'])
      ? source['density']
      : ENVIRONMENT_DEFAULTS.density;
    const direction = includesValue(DIRECTIONS, source['direction'])
      ? source['direction']
      : ENVIRONMENT_DEFAULTS.direction;
    const locale = includesValue(LOCALES, source['locale'])
      ? source['locale']
      : ENVIRONMENT_DEFAULTS.locale;
    const motion = includesValue(MOTIONS, source['motion'])
      ? source['motion']
      : ENVIRONMENT_DEFAULTS.motion;
    const brandColor = normalizeBrandColor(source['brandColor']);
    const viewport = includesValue(VIEWPORTS, source['viewport'])
      ? source['viewport']
      : ENVIRONMENT_DEFAULTS.viewport;
    const scenario = includesValue(this.scenarios(), source['scenario'])
      ? source['scenario']
      : ENVIRONMENT_DEFAULTS.scenario;
    const state =
      source['state'] && this.definition().states.includes(source['state'])
        ? source['state']
        : 'default';
    const preset =
      this.presets().find(({ id }) => id === state) ??
      this.presets().find(({ id }) => id === 'default') ??
      this.presets()[0];
    const presetEnvironment = preset?.environment ?? {};

    if (!owns(presetEnvironment, 'theme') && theme !== ENVIRONMENT_DEFAULTS.theme) {
      query['theme'] = theme;
    }
    if (!owns(presetEnvironment, 'density') && density !== ENVIRONMENT_DEFAULTS.density) {
      query['density'] = density;
    }
    if (!owns(presetEnvironment, 'direction') && direction !== ENVIRONMENT_DEFAULTS.direction) {
      query['direction'] = direction;
    }
    if (locale !== ENVIRONMENT_DEFAULTS.locale) query['locale'] = locale;
    if (motion !== ENVIRONMENT_DEFAULTS.motion) query['motion'] = motion;
    if (brandColor !== ENVIRONMENT_DEFAULTS.brandColor) query['brandColor'] = brandColor;
    if (!owns(presetEnvironment, 'viewport') && viewport !== ENVIRONMENT_DEFAULTS.viewport) {
      query['viewport'] = viewport;
    }
    if (preset?.scenario === 'default' && scenario !== ENVIRONMENT_DEFAULTS.scenario) {
      query['scenario'] = scenario;
    }
    if (state !== 'default') query['state'] = state;

    const normalizedArgs = enforceComponentConstraints(
      this.item().id,
      normalizeKernPlaygroundValues(
        this.definition(),
        Object.fromEntries(
          this.controls().map((control) => [
            control.key,
            this.parseControlValue(control, source[`arg.${control.key}`] ?? null),
          ]),
        ),
      ),
    );
    for (const control of this.controls()) {
      const value = normalizedArgs[control.key];
      if (
        this.item().id === 'data-grid' &&
        control.key === 'expandable' &&
        normalizedArgs['virtualize'] === true
      ) {
        continue;
      }
      if (!owns(preset?.args ?? {}, control.key) && !Object.is(value, control.defaultValue)) {
        query[`arg.${control.key}`] = serializePlaygroundValue(value);
      }
    }

    return query;
  }

  private parseControlValue(
    control: KernPlaygroundControl,
    raw: string | null,
  ): KernPlaygroundValue {
    if (raw === null) return control.defaultValue;

    if (control.kind === 'boolean') {
      return raw === 'true' ? true : raw === 'false' ? false : control.defaultValue;
    }

    if (control.kind === 'number' || control.kind === 'range') {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return control.defaultValue;
      const minimum = control.min ?? Number.NEGATIVE_INFINITY;
      const maximum = control.max ?? Number.POSITIVE_INFINITY;
      return Math.min(maximum, Math.max(minimum, parsed));
    }

    if (control.kind === 'select') {
      return (
        control.options?.find((option) => serializePlaygroundValue(option.value) === raw)?.value ??
        control.defaultValue
      );
    }

    return raw.slice(0, 240);
  }
}
