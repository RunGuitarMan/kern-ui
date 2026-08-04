import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  type EmbeddedViewRef,
  Injectable,
  InjectionToken,
  Injector,
  ViewContainerRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KRN_PLATFORM, KrnOverlayCoordinator, type KrnPlatformAdapter } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS, provideKrn } from '@kern-ui/angular/core';
import { KrnDropdownButton } from '../actions/dropdown-button';
import { KrnDialog } from './modal-overlays';
import {
  KrnOverlayService,
  defineKrnOverlayContent,
  injectKrnOverlayData,
  injectKrnOverlayRef,
  type KrnOverlayRef,
  type KrnOverlayDismissReason,
  type KrnOverlayContent,
  type KrnOverlayOutcome,
  type KrnOverlayTemplateContext,
} from './programmatic-overlay';

interface EditData {
  readonly name: string;
}

@Injectable()
class ScopedOverlayResource {
  static destroyCount = 0;

  ngOnDestroy(): void {
    ScopedOverlayResource.destroyCount += 1;
  }
}

@Component({
  selector: 'krn-programmatic-edit-content-spec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" class="save" (click)="save()">Save {{ data.name }}</button>`,
})
class EditOverlayContent {
  protected readonly data = injectKrnOverlayData(EDIT_OVERLAY);
  private readonly overlayRef = injectKrnOverlayRef(EDIT_OVERLAY);
  private readonly scopedResource = inject(ScopedOverlayResource);

  protected save(): void {
    void this.scopedResource;
    this.overlayRef.close(`saved:${this.data.name}`);
  }
}

const EDIT_OVERLAY = defineKrnOverlayContent<EditData, string>(EditOverlayContent);

interface TemplateData {
  readonly label: string;
}

type TemplateDismissReason = KrnOverlayDismissReason | 'template-cancel';

@Component({
  selector: 'krn-programmatic-template-owner-spec',
  standalone: true,
  template: `
    <ng-template #overlayTemplate let-data let-explicitData="data" let-overlayRef="overlayRef">
      <span class="template-data">{{ data.label }} / {{ explicitData.label }}</span>
      <button type="button" class="template-cancel" (click)="overlayRef.dismiss('template-cancel')">
        Cancel template
      </button>
    </ng-template>
  `,
})
class TemplateOwner {
  readonly template =
    viewChild.required<
      TemplateRef<KrnOverlayTemplateContext<TemplateData, void, TemplateDismissReason>>
    >('overlayTemplate');
  readonly viewContainerRef = inject(ViewContainerRef);
}

@Component({
  selector: 'krn-programmatic-passive-content-spec',
  standalone: true,
  template: `<p class="passive-content">Passive content</p>`,
})
class PassiveOverlayContent {}

const PASSIVE_OVERLAY = defineKrnOverlayContent(PassiveOverlayContent);

const SCOPED_OVERLAY_VALUE = new InjectionToken<string>('SCOPED_OVERLAY_VALUE');

@Component({
  selector: 'krn-programmatic-scoped-content-spec',
  standalone: true,
  template: `<p class="scoped-content">{{ value }}</p>`,
})
class ScopedOverlayContent {
  protected readonly value = inject(SCOPED_OVERLAY_VALUE);
}

const SCOPED_OVERLAY = defineKrnOverlayContent(ScopedOverlayContent);

@Component({
  selector: 'krn-programmatic-nested-menu-content-spec',
  standalone: true,
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button>
      <span krnLabel>Actions</span>
      <button krnMenu type="button" role="menuitem" class="nested-programmatic-item">
        Archive
      </button>
    </krn-dropdown-button>
  `,
})
class NestedMenuOverlayContent {}

const NESTED_MENU_OVERLAY = defineKrnOverlayContent(NestedMenuOverlayContent);

@Component({
  selector: 'krn-programmatic-constructor-close-spec',
  standalone: true,
  template: `Constructor close`,
})
class ConstructorCloseContent {
  constructor() {
    injectKrnOverlayRef(CONSTRUCTOR_CLOSE_OVERLAY).close('constructor-result');
  }
}

const CONSTRUCTOR_CLOSE_OVERLAY = defineKrnOverlayContent<undefined, string>(
  ConstructorCloseContent,
);

interface ParentData {
  readonly childOpened: (ref: KrnOverlayRef<void, KrnOverlayDismissReason>) => void;
}

@Component({
  selector: 'krn-programmatic-parent-content-spec',
  standalone: true,
  template: `<button type="button" class="open-child" (click)="openChild()">Open child</button>`,
})
class ParentOverlayContent {
  private readonly data = injectKrnOverlayData(PARENT_OVERLAY);
  private readonly injector = inject(Injector);
  private readonly overlays = inject(KrnOverlayService);

  protected openChild(): void {
    const child = this.overlays.open(PASSIVE_OVERLAY, {
      injector: this.injector,
      title: 'Child overlay',
      variant: 'drawer',
    });
    this.data.childOpened(child);
  }
}

const PARENT_OVERLAY = defineKrnOverlayContent<ParentData>(ParentOverlayContent);

function assertTypedOverlayContract(service: KrnOverlayService): void {
  const ref = service.open(EDIT_OVERLAY, { data: { name: 'Ada' } });
  ref.close('saved:Ada');
  // @ts-expect-error The shared content contract fixes the result type to string.
  ref.close(42);
  // @ts-expect-error The shared content contract fixes the data shape to EditData.
  service.open(EDIT_OVERLAY, { data: { name: 42 } });
  // @ts-expect-error Raw component types cannot assert unrelated Data/Result generics.
  service.open(EditOverlayContent, { data: { name: 'Ada' } });

  interface BaseData {
    readonly name: string;
  }
  interface DerivedData extends BaseData {
    readonly accountId: string;
  }
  type BaseResult = { readonly saved: boolean };
  type DerivedResult = BaseResult & { readonly revision: number };
  const derivedData = defineKrnOverlayContent<DerivedData, BaseResult, 'cancel'>(
    EditOverlayContent,
  );
  const baseData = defineKrnOverlayContent<BaseData, BaseResult, 'cancel'>(EditOverlayContent);
  const derivedResult = defineKrnOverlayContent<BaseData, DerivedResult, 'cancel'>(
    EditOverlayContent,
  );
  const widerDismiss = defineKrnOverlayContent<BaseData, BaseResult, 'cancel' | 'timeout'>(
    EditOverlayContent,
  );
  // @ts-expect-error Required hidden brand prevents structural contract forgery.
  const forged: KrnOverlayContent<BaseData, BaseResult, 'cancel'> = {
    component: EditOverlayContent,
  };
  // @ts-expect-error Data is invariant; derived content cannot accept arbitrary base data.
  const unsafeDataWidening: typeof baseData = derivedData;
  // @ts-expect-error Data is invariant in the opposite direction too.
  const unsafeDataNarrowing: typeof derivedData = baseData;
  // @ts-expect-error Result is invariant; callers cannot widen close values.
  const unsafeResultWidening: typeof derivedResult = baseData;
  // @ts-expect-error Result is invariant in the opposite direction too.
  const unsafeResultNarrowing: typeof baseData = derivedResult;
  // @ts-expect-error Custom dismiss reasons cannot be widened after definition.
  const unsafeDismissWidening: typeof widerDismiss = baseData;
  // @ts-expect-error Custom dismiss reasons are invariant in the opposite direction too.
  const unsafeDismissNarrowing: typeof baseData = widerDismiss;

  void [
    forged,
    unsafeDataWidening,
    unsafeDataNarrowing,
    unsafeResultWidening,
    unsafeResultNarrowing,
    unsafeDismissWidening,
    unsafeDismissNarrowing,
  ];
}

void assertTypedOverlayContract;

@Component({
  selector: 'krn-programmatic-view-owner-spec',
  standalone: true,
  template: `Owner`,
})
class ViewOwner {
  readonly viewContainerRef = inject(ViewContainerRef);
}

@Component({
  selector: 'krn-programmatic-mixed-stack-owner-spec',
  standalone: true,
  imports: [KrnDialog],
  template: `<krn-dialog title="Declarative top layer" [(open)]="open" />`,
})
class MixedStackOwner {
  readonly open = signal(false);
}

describe('KrnOverlayService', () => {
  beforeEach(async () => {
    ScopedOverlayResource.destroyCount = 0;
    await TestBed.configureTestingModule({
      imports: [
        EditOverlayContent,
        TemplateOwner,
        PassiveOverlayContent,
        ScopedOverlayContent,
        NestedMenuOverlayContent,
        ConstructorCloseContent,
        ParentOverlayContent,
        ViewOwner,
        MixedStackOwner,
      ],
      providers: [provideKrn({ persistPreferences: false }), provideLocationMocks()],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('injects typed component data and settles exactly once after disposal', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(EDIT_OVERLAY, {
      data: { name: 'Ada' },
      providers: [ScopedOverlayResource],
      title: 'Edit profile',
    });
    const outcomes: Array<KrnOverlayOutcome<string>> = [];
    let completions = 0;
    ref.closed.subscribe({
      next: (outcome) => outcomes.push(outcome),
      complete: () => {
        completions += 1;
      },
    });

    await stabilize();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    (document.querySelector('.save') as HTMLButtonElement).click();
    expect(ref.dismiss('api')).toBe(false);
    await stabilize();

    expect(outcomes).toEqual([{ kind: 'closed', result: 'saved:Ada' }]);
    expect(completions).toBe(1);
    expect(ScopedOverlayResource.destroyCount).toBe(1);
    expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();

    const replayed: Array<KrnOverlayOutcome<string>> = [];
    ref.closed.subscribe((outcome) => replayed.push(outcome));
    expect(replayed).toEqual(outcomes);
  });

  it('inherits caller labels and content providers without replacing root overlay runtime', async () => {
    const rootInjector = TestBed.inject(Injector);
    const translations = TestBed.inject(KRN_TRANSLATIONS);
    const scopedPlatformRead = vi.fn(() => false);
    const scopedCoordinator = {
      activate: vi.fn(() => {
        throw new Error('Scoped coordinator must not own a root overlay pane.');
      }),
    };
    const scopedPlatform = {
      get isBrowser(): boolean {
        return scopedPlatformRead();
      },
    } as KrnPlatformAdapter;
    const scopedInjector = Injector.create({
      parent: rootInjector,
      providers: [
        { provide: KRN_PLATFORM, useValue: scopedPlatform },
        { provide: KrnOverlayCoordinator, useValue: scopedCoordinator },
        { provide: SCOPED_OVERLAY_VALUE, useValue: 'Scoped content' },
        {
          provide: KRN_TRANSLATIONS,
          useValue: {
            ...translations,
            feedback: {
              ...translations.feedback,
              close: 'Scoped close',
              dialog: 'Scoped dialog',
            },
          },
        },
      ],
    });
    const ref = TestBed.inject(KrnOverlayService).open(SCOPED_OVERLAY, {
      injector: scopedInjector,
    });

    try {
      await stabilize();
      expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
        'Scoped dialog',
      );
      expect(document.querySelector('.close')?.getAttribute('aria-label')).toBe('Scoped close');
      expect(document.querySelector('.scoped-content')?.textContent).toContain('Scoped content');
      expect(scopedPlatformRead).not.toHaveBeenCalled();
      expect(scopedCoordinator.activate).not.toHaveBeenCalled();
    } finally {
      ref.dismiss('api');
      await stabilize();
      scopedInjector.destroy();
    }
  });

  it('stamps a typed TemplateRef context in its explicit logical owner', async () => {
    const owner = TestBed.createComponent(TemplateOwner);
    owner.detectChanges();
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open<TemplateData, void, 'template-cancel'>(
      owner.componentInstance.template(),
      {
        data: { label: 'Quarterly report' },
        title: 'Template overlay',
        viewContainerRef: owner.componentInstance.viewContainerRef,
      },
    );
    const outcomes: Array<KrnOverlayOutcome<void, TemplateDismissReason>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    await stabilize();
    expect(document.querySelector('.template-data')?.textContent).toContain(
      'Quarterly report / Quarterly report',
    );
    (document.querySelector('.template-cancel') as HTMLButtonElement).click();
    await stabilize();

    expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'template-cancel' }]);
    owner.destroy();
  });

  it('dismisses on Angular Location changes and removes the rendered host', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const location = TestBed.inject(Location);
    const ref = service.open(PASSIVE_OVERLAY, {
      closeOnNavigation: true,
      title: 'Navigation-sensitive overlay',
    });
    const outcomes: Array<KrnOverlayOutcome<void>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    await stabilize();
    location.go('/next');
    await stabilize();

    expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'navigation' }]);
    expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();
  });

  it('dismisses descendants as parent-owned before completing the parent', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const childRefs: Array<KrnOverlayRef<void, KrnOverlayDismissReason>> = [];
    const parentRef = service.open(PARENT_OVERLAY, {
      data: {
        childOpened: (ref) => {
          childRefs.push(ref);
        },
      },
      title: 'Parent overlay',
    });
    const parentOutcomes: Array<KrnOverlayOutcome<void>> = [];
    const childOutcomes: Array<KrnOverlayOutcome<void>> = [];
    parentRef.closed.subscribe((outcome) => parentOutcomes.push(outcome));

    await stabilize();
    (document.querySelector('.open-child') as HTMLButtonElement).click();
    await stabilize();
    expect(childRefs).toHaveLength(1);
    childRefs[0]?.closed.subscribe((outcome) => childOutcomes.push(outcome));

    expect(parentRef.dismiss('api')).toBe(true);
    await stabilize();

    expect(childOutcomes).toEqual([{ kind: 'dismissed', reason: 'parent' }]);
    expect(parentOutcomes).toEqual([{ kind: 'dismissed', reason: 'api' }]);
    expect(document.querySelectorAll('krn-programmatic-overlay-host')).toHaveLength(0);
  });

  it('settles as destroyed when its logical view owner is destroyed', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    const focusSpy = vi.spyOn(opener, 'focus');
    opener.focus();
    const owner = TestBed.createComponent(ViewOwner);
    let ownerDestroyed = false;
    owner.detectChanges();
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(PASSIVE_OVERLAY, {
      restoreFocus: opener,
      title: 'Owned overlay',
      viewContainerRef: owner.componentInstance.viewContainerRef,
    });
    const outcomes: Array<KrnOverlayOutcome<void>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    try {
      await stabilize();
      focusSpy.mockClear();
      owner.destroy();
      ownerDestroyed = true;
      await stabilize();

      expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'destroy' }]);
      expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      if (!ownerDestroyed) owner.destroy();
      opener.remove();
    }
  });

  it('waits for the modal surface after only its content view is destroyed', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const owner = TestBed.createComponent(ViewOwner);
    owner.detectChanges();
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(PASSIVE_OVERLAY, {
      title: 'Owned animated overlay',
      variant: 'drawer',
      viewContainerRef: owner.componentInstance.viewContainerRef,
    });
    const outcomes: Array<KrnOverlayOutcome<void>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    try {
      await stabilize();
      const container = owner.componentInstance.viewContainerRef;
      const contentIndex = Array.from({ length: container.length }, (_, index) => index).find(
        (index) =>
          (container.get(index) as EmbeddedViewRef<unknown>).rootNodes.some(
            (node: unknown) =>
              node instanceof HTMLElement && node.matches('krn-programmatic-passive-content-spec'),
          ),
      );
      expect(contentIndex).toBeDefined();
      if (contentIndex === undefined) throw new Error('Expected an attached content view.');
      container.remove(contentIndex);
      TestBed.inject(ApplicationRef).tick();

      const backdrop = document.querySelector('.backdrop') as HTMLElement;
      expect(outcomes).toEqual([]);
      expect(backdrop.dataset['state']).toBe('closing');
      dispatchOpacityTransitionEnd(backdrop);
      await stabilize();

      expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'destroy' }]);
      expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();
    } finally {
      owner.destroy();
      vi.unstubAllGlobals();
    }
  });

  it('maps the declarative close action into a typed dismissal', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(PASSIVE_OVERLAY, { title: 'Close action overlay' });
    const outcomes: Array<KrnOverlayOutcome<void>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    await stabilize();
    (document.querySelector('.close') as HTMLButtonElement).click();
    await stabilize();

    expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'action' }]);
  });

  it('binds the ref before constructing component content', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(CONSTRUCTOR_CLOSE_OVERLAY, {
      title: 'Constructor close overlay',
    });
    const outcomes: Array<KrnOverlayOutcome<string>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    await stabilize();

    expect(outcomes).toEqual([{ kind: 'closed', result: 'constructor-result' }]);
    expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();
  });

  it('keeps a CDK popup opened from programmatic content inside the active modal zone', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open(NESTED_MENU_OVERLAY, { title: 'Programmatic actions' });
    await stabilize();

    (document.querySelector('.krn-action') as HTMLButtonElement).click();
    await stabilize();

    const item = document.querySelector('.nested-programmatic-item') as HTMLElement;
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    const nestedBranch = [...overlayContainer.children].find((element) =>
      element.contains(item),
    ) as HTMLElement | undefined;
    expect(item).not.toBeNull();
    expect(nestedBranch?.inert).not.toBe(true);
    expect(nestedBranch?.getAttribute('aria-hidden')).not.toBe('true');

    ref.dismiss('api');
    await stabilize();
  });

  it('keeps resources attached until the surface emits afterExited', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    try {
      const application = TestBed.inject(ApplicationRef);
      const service = TestBed.inject(KrnOverlayService);
      const ref = service.open(PASSIVE_OVERLAY, {
        title: 'Animated drawer',
        variant: 'drawer',
      });
      const outcomes: Array<KrnOverlayOutcome<void>> = [];
      ref.closed.subscribe((outcome) => outcomes.push(outcome));
      await application.whenStable();

      expect(ref.dismiss('api')).toBe(true);
      application.tick();
      expect(outcomes).toEqual([]);
      expect(document.querySelector('.backdrop')?.getAttribute('data-state')).toBe('closing');
      expect(document.querySelector('krn-programmatic-overlay-host')).not.toBeNull();

      const backdrop = document.querySelector('.backdrop') as HTMLElement;
      const transition = new Event('transitionend');
      Object.defineProperty(transition, 'propertyName', { value: 'opacity' });
      backdrop.dispatchEvent(transition);
      await stabilize();

      expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'api' }]);
      expect(document.querySelector('krn-programmatic-overlay-host')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('visually suppresses an inert programmatic branch below a declarative modal', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const programmatic = service.open(PASSIVE_OVERLAY, { title: 'Programmatic layer' });
    const declarative = TestBed.createComponent(MixedStackOwner);
    declarative.detectChanges();
    await stabilize();

    const programmaticHost = document.querySelector('krn-programmatic-overlay-host') as HTMLElement;
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    const programmaticBranch = [...overlayContainer.children].find((element) =>
      element.contains(programmaticHost),
    ) as HTMLElement | undefined;
    expect(programmaticBranch?.inert).not.toBe(true);

    declarative.componentInstance.open.set(true);
    declarative.detectChanges();
    await stabilize();

    expect(programmaticBranch?.inert).toBe(true);
    expect(getComputedStyle(programmaticHost).visibility).toBe('hidden');

    declarative.componentInstance.open.set(false);
    declarative.detectChanges();
    await stabilize();
    expect(programmaticBranch?.inert).not.toBe(true);

    programmatic.dismiss('api');
    await stabilize();
    declarative.destroy();
  });

  it('finishes child exit before parent exit so the parent opener always regains focus', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const opener = document.createElement('button');
    opener.textContent = 'Open parent';
    document.body.append(opener);
    opener.focus();

    try {
      const service = TestBed.inject(KrnOverlayService);
      const childRefs: Array<KrnOverlayRef<void, KrnOverlayDismissReason>> = [];
      const parentRef = service.open(PARENT_OVERLAY, {
        data: { childOpened: (ref) => childRefs.push(ref) },
        title: 'Animated parent',
        variant: 'drawer',
      });
      await stabilize();
      (document.querySelector('.open-child') as HTMLButtonElement).click();
      await stabilize();

      const hosts = [...document.querySelectorAll('krn-programmatic-overlay-host')];
      const parentBackdrop = hosts[0]?.querySelector('.backdrop') as HTMLElement;
      const childBackdrop = hosts[1]?.querySelector('.backdrop') as HTMLElement;
      expect(childRefs).toHaveLength(1);
      expect(parentRef.dismiss('api')).toBe(true);
      TestBed.inject(ApplicationRef).tick();

      expect(parentBackdrop.dataset['state']).toBe('open');
      expect(childBackdrop.dataset['state']).toBe('closing');
      dispatchOpacityTransitionEnd(childBackdrop);
      await stabilize();

      expect(parentBackdrop.dataset['state']).toBe('closing');
      dispatchOpacityTransitionEnd(parentBackdrop);
      await stabilize();
      expect(document.activeElement).toBe(opener);
    } finally {
      opener.remove();
      vi.unstubAllGlobals();
    }
  });
});

function dispatchOpacityTransitionEnd(element: HTMLElement): void {
  const transition = new Event('transitionend');
  Object.defineProperty(transition, 'propertyName', { value: 'opacity' });
  element.dispatchEvent(transition);
}

async function stabilize(): Promise<void> {
  const application = TestBed.inject(ApplicationRef);
  await application.whenStable();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await application.whenStable();
}
