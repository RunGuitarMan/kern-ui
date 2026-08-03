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
  KrnOverlayRef,
  KrnOverlayService,
  injectKrnOverlayData,
  type KrnOverlayDismissReason,
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
  protected readonly data = injectKrnOverlayData<EditData>();
  private readonly overlayRef = inject<KrnOverlayRef<string>>(KrnOverlayRef);
  private readonly scopedResource = inject(ScopedOverlayResource);

  protected save(): void {
    void this.scopedResource;
    this.overlayRef.close(`saved:${this.data.name}`);
  }
}

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

const SCOPED_OVERLAY_VALUE = new InjectionToken<string>('SCOPED_OVERLAY_VALUE');

@Component({
  selector: 'krn-programmatic-scoped-content-spec',
  standalone: true,
  template: `<p class="scoped-content">{{ value }}</p>`,
})
class ScopedOverlayContent {
  protected readonly value = inject(SCOPED_OVERLAY_VALUE);
}

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

@Component({
  selector: 'krn-programmatic-constructor-close-spec',
  standalone: true,
  template: `Constructor close`,
})
class ConstructorCloseContent {
  constructor() {
    inject<KrnOverlayRef<string>>(KrnOverlayRef).close('constructor-result');
  }
}

interface ParentData {
  readonly childOpened: (ref: KrnOverlayRef<void, KrnOverlayDismissReason>) => void;
}

@Component({
  selector: 'krn-programmatic-parent-content-spec',
  standalone: true,
  template: `<button type="button" class="open-child" (click)="openChild()">Open child</button>`,
})
class ParentOverlayContent {
  private readonly data = injectKrnOverlayData<ParentData>();
  private readonly injector = inject(Injector);
  private readonly overlays = inject(KrnOverlayService);

  protected openChild(): void {
    const child = this.overlays.open(PassiveOverlayContent, {
      injector: this.injector,
      title: 'Child overlay',
      variant: 'drawer',
    });
    this.data.childOpened(child);
  }
}

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
    const ref = service.open<EditData, string>(EditOverlayContent, {
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
    const ref = TestBed.inject(KrnOverlayService).open(ScopedOverlayContent, {
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
    const ref = service.open(PassiveOverlayContent, {
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
    const parentRef = service.open<ParentData, void>(ParentOverlayContent, {
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
    const ref = service.open(PassiveOverlayContent, {
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
    const ref = service.open(PassiveOverlayContent, {
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
    const ref = service.open(PassiveOverlayContent, { title: 'Close action overlay' });
    const outcomes: Array<KrnOverlayOutcome<void>> = [];
    ref.closed.subscribe((outcome) => outcomes.push(outcome));

    await stabilize();
    (document.querySelector('.close') as HTMLButtonElement).click();
    await stabilize();

    expect(outcomes).toEqual([{ kind: 'dismissed', reason: 'action' }]);
  });

  it('binds the ref before constructing component content', async () => {
    const service = TestBed.inject(KrnOverlayService);
    const ref = service.open<string>(ConstructorCloseContent, {
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
    const ref = service.open(NestedMenuOverlayContent, { title: 'Programmatic actions' });
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
      const ref = service.open(PassiveOverlayContent, {
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
    const programmatic = service.open(PassiveOverlayContent, { title: 'Programmatic layer' });
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
      const parentRef = service.open<ParentData, void>(ParentOverlayContent, {
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
