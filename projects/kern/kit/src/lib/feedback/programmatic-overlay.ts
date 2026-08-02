import { Location } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';
import type { OverlayRef } from '@angular/cdk/overlay';
import {
  CdkPortalOutlet,
  ComponentPortal,
  PortalModule,
  TemplatePortal,
} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  Injectable,
  Injector,
  TemplateRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ComponentRef,
  DestroyableInjector,
  Provider,
  StaticProvider,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { ReplaySubject } from 'rxjs';
import type { Observable } from 'rxjs';
import { KRN_PLATFORM, KrnIdService, type KrnOverlayInitialFocus } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnOverlayCloseReason } from './feedback.types';
import { KrnAlertDialog, KrnBottomSheet, KrnDialog, KrnDrawer } from './modal-overlays';

export type KrnOverlayVariant = 'dialog' | 'alert-dialog' | 'drawer' | 'bottom-sheet';

/** Reasons that settle a programmatically opened overlay without a result. */
export type KrnOverlayDismissReason =
  KrnOverlayCloseReason | 'navigation' | 'destroy' | 'parent' | 'ssr';

/** The single terminal value produced by a programmatic overlay. */
export type KrnOverlayOutcome<Result, DismissReason extends string = KrnOverlayDismissReason> =
  | { readonly kind: 'closed'; readonly result: Result }
  | { readonly kind: 'dismissed'; readonly reason: DismissReason };

/**
 * Controls and observes one programmatic overlay.
 *
 * `close` and `dismiss` return `true` only for the first terminal request. The
 * `closed` stream emits once after the surface has exited and all owned views
 * have been disposed, then completes. It replays that value to late subscribers.
 */
export abstract class KrnOverlayRef<
  Result = void,
  DismissReason extends string = KrnOverlayDismissReason,
> {
  abstract readonly id: string;
  abstract readonly closed: Observable<KrnOverlayOutcome<Result, DismissReason>>;
  abstract close(result: Result): boolean;
  abstract dismiss(reason: DismissReason): boolean;
}

/** Data injected into component content opened by `KrnOverlayService`. */
export const KRN_OVERLAY_DATA = new InjectionToken<unknown>('KRN_OVERLAY_DATA');

/** Typed access to `KRN_OVERLAY_DATA` from programmatic component content. */
export function injectKrnOverlayData<Data>(): Data {
  return inject(KRN_OVERLAY_DATA) as Data;
}

/** Context stamped into programmatic `TemplateRef` content. */
export interface KrnOverlayTemplateContext<
  Data,
  Result,
  DismissReason extends string = KrnOverlayDismissReason,
> {
  readonly $implicit: Data;
  readonly data: Data;
  readonly overlayRef: KrnOverlayRef<Result, DismissReason>;
}

/** Typed configuration for a programmatically opened overlay. */
export type KrnOverlayConfig<Data = undefined> = {
  readonly variant?: KrnOverlayVariant;
  readonly title?: string;
  readonly description?: string;
  readonly ariaLabel?: string;
  readonly showClose?: boolean;
  readonly closeOnEscape?: boolean;
  readonly closeOnOutside?: boolean | null;
  readonly closeOnNavigation?: boolean;
  readonly initialFocus?: KrnOverlayInitialFocus;
  /** `undefined` captures the current/pointer origin; `false` disables restoration. */
  readonly restoreFocus?: HTMLElement | false;
  /** Logical Angular owner for content. Required for templates. */
  readonly viewContainerRef?: ViewContainerRef;
  /** Explicit parent injector for content. Wins over `viewContainerRef.injector`. */
  readonly injector?: Injector;
  /** Providers scoped to content and destroyed with this overlay. */
  readonly providers?: readonly Provider[];
} & ([Data] extends [undefined] ? { readonly data?: undefined } : { readonly data: Data });

type KrnOverlayBaseConfig = Omit<KrnOverlayConfig<unknown>, 'data'>;

interface NormalizedOverlayConfig {
  readonly variant: KrnOverlayVariant;
  readonly title: string;
  readonly description: string;
  readonly ariaLabel: string;
  readonly showClose: boolean;
  readonly closeOnEscape: boolean;
  readonly closeOnOutside: boolean | null;
  readonly closeOnNavigation: boolean;
  readonly initialFocus: KrnOverlayInitialFocus;
  readonly restoreFocus: HTMLElement | false | null;
}

const KRN_PROGRAMMATIC_OVERLAY_CONFIG = new InjectionToken<NormalizedOverlayConfig>(
  'KRN_PROGRAMMATIC_OVERLAY_CONFIG',
);

/**
 * @internalReviewWith kit:KrnDialog
 */
@Component({
  selector: 'krn-programmatic-overlay-host',
  standalone: true,
  imports: [PortalModule, KrnDialog, KrnAlertDialog, KrnDrawer, KrnBottomSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'krn-programmatic-overlay-host' },
  template: `
    @switch (config.variant) {
      @case ('alert-dialog') {
        <krn-alert-dialog
          [open]="surfaceOpen()"
          (openChange)="surfaceOpen.set($event)"
          [title]="config.title"
          [description]="config.description"
          [ariaLabel]="config.ariaLabel"
          [showClose]="config.showClose"
          [closeOnEscape]="config.closeOnEscape"
          [closeOnOutside]="config.closeOnOutside"
          [initialFocus]="config.initialFocus"
          [restoreFocus]="effectiveRestoreFocus()"
          (closed)="dismissRequested.emit($event)"
          (afterExited)="afterExited.emit()"
        >
          <ng-template cdkPortalOutlet />
        </krn-alert-dialog>
      }
      @case ('drawer') {
        <krn-drawer
          [open]="surfaceOpen()"
          (openChange)="surfaceOpen.set($event)"
          [title]="config.title"
          [description]="config.description"
          [ariaLabel]="config.ariaLabel"
          [showClose]="config.showClose"
          [closeOnEscape]="config.closeOnEscape"
          [closeOnOutside]="config.closeOnOutside"
          [initialFocus]="config.initialFocus"
          [restoreFocus]="effectiveRestoreFocus()"
          (closed)="dismissRequested.emit($event)"
          (afterExited)="afterExited.emit()"
        >
          <ng-template cdkPortalOutlet />
        </krn-drawer>
      }
      @case ('bottom-sheet') {
        <krn-bottom-sheet
          [open]="surfaceOpen()"
          (openChange)="surfaceOpen.set($event)"
          [title]="config.title"
          [description]="config.description"
          [ariaLabel]="config.ariaLabel"
          [showClose]="config.showClose"
          [closeOnEscape]="config.closeOnEscape"
          [closeOnOutside]="config.closeOnOutside"
          [initialFocus]="config.initialFocus"
          [restoreFocus]="effectiveRestoreFocus()"
          (closed)="dismissRequested.emit($event)"
          (afterExited)="afterExited.emit()"
        >
          <ng-template cdkPortalOutlet />
        </krn-bottom-sheet>
      }
      @default {
        <krn-dialog
          [open]="surfaceOpen()"
          (openChange)="surfaceOpen.set($event)"
          [title]="config.title"
          [description]="config.description"
          [ariaLabel]="config.ariaLabel"
          [showClose]="config.showClose"
          [closeOnEscape]="config.closeOnEscape"
          [closeOnOutside]="config.closeOnOutside"
          [initialFocus]="config.initialFocus"
          [restoreFocus]="effectiveRestoreFocus()"
          (closed)="dismissRequested.emit($event)"
          (afterExited)="afterExited.emit()"
        >
          <ng-template cdkPortalOutlet />
        </krn-dialog>
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    :host-context([inert]) {
      visibility: hidden;
    }
  `,
})
class KrnProgrammaticOverlayHost {
  protected readonly config = inject(KRN_PROGRAMMATIC_OVERLAY_CONFIG);
  protected readonly surfaceOpen = signal(true);
  private readonly restoreFocusOverride = signal<false | undefined>(undefined);
  protected readonly effectiveRestoreFocus = computed(
    () => this.restoreFocusOverride() ?? this.config.restoreFocus,
  );
  readonly portalOutlet = viewChild.required(CdkPortalOutlet);
  readonly dismissRequested = output<KrnOverlayCloseReason>();
  readonly afterExited = output<void>();

  beginExit(suppressFocusRestore: boolean): void {
    if (suppressFocusRestore) this.restoreFocusOverride.set(false);
    this.surfaceOpen.set(false);
  }

  suppressFocusRestoration(): void {
    this.restoreFocusOverride.set(false);
  }
}

type OverlayState = 'open' | 'exiting' | 'closed';

class KrnOverlayRefImpl extends KrnOverlayRef<unknown, string> {
  private readonly outcome = new ReplaySubject<KrnOverlayOutcome<unknown, string>>(1);
  private state: OverlayState = 'open';
  private terminalValue: KrnOverlayOutcome<unknown, string> | null = null;
  private beginExit: ((outcome: KrnOverlayOutcome<unknown, string>) => void) | null = null;
  override readonly closed = this.outcome.asObservable();

  constructor(override readonly id: string) {
    super();
  }

  bind(beginExit: (outcome: KrnOverlayOutcome<unknown, string>) => void): void {
    this.beginExit = beginExit;
  }

  override close(result: unknown): boolean {
    return this.settle({ kind: 'closed', result });
  }

  override dismiss(reason: string): boolean {
    return this.settle({ kind: 'dismissed', reason });
  }

  finalize(): boolean {
    if (this.state !== 'exiting' || !this.terminalValue) return false;
    this.state = 'closed';
    this.outcome.next(this.terminalValue);
    this.outcome.complete();
    this.beginExit = null;
    return true;
  }

  acceptsChildren(): boolean {
    return this.state === 'open';
  }

  private settle(outcome: KrnOverlayOutcome<unknown, string>): boolean {
    if (this.state !== 'open') return false;
    this.state = 'exiting';
    this.terminalValue = outcome;
    this.beginExit?.(outcome);
    return true;
  }
}

interface SubscriptionLike {
  unsubscribe(): void;
}

interface ActiveOverlayRecord {
  readonly ref: KrnOverlayRefImpl;
  readonly overlayRef: OverlayRef;
  readonly hostRef: ComponentRef<KrnProgrammaticOverlayHost>;
  readonly hostInjector: DestroyableInjector;
  readonly contentInjector: DestroyableInjector;
  readonly subscriptions: SubscriptionLike[];
  readonly children: Set<ActiveOverlayRecord>;
  parent: ActiveOverlayRecord | null;
  removeNavigationListener: (() => void) | null;
  exitRequested: boolean;
  exitStarted: boolean;
  suppressFocusRestore: boolean;
  surfaceExited: boolean;
  finalizeScheduled: boolean;
  finalizing: boolean;
}

/** Opens typed component or template content in one of Kern's modal surfaces. */
@Injectable({ providedIn: 'root' })
export class KrnOverlayService {
  private readonly injector = inject(Injector);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly ids = inject(KrnIdService);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly destroyRef = inject(DestroyRef);
  private readonly records = new Map<string, ActiveOverlayRecord>();
  private destroying = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroying = true;
      for (const record of [...this.records.values()].reverse()) {
        record.ref.dismiss('destroy');
        this.finalizeRecord(record);
      }
    });
  }

  open<Result = void, CustomDismissReason extends string = never>(
    content: Type<unknown>,
    config?: KrnOverlayConfig<undefined>,
  ): KrnOverlayRef<Result, KrnOverlayDismissReason | CustomDismissReason>;
  open<Data, Result = void, CustomDismissReason extends string = never>(
    content: Type<unknown>,
    config: KrnOverlayConfig<Data>,
  ): KrnOverlayRef<Result, KrnOverlayDismissReason | CustomDismissReason>;
  open<Data, Result = void, CustomDismissReason extends string = never>(
    content: TemplateRef<
      KrnOverlayTemplateContext<Data, Result, KrnOverlayDismissReason | CustomDismissReason>
    >,
    config: KrnOverlayConfig<Data> & { readonly viewContainerRef: ViewContainerRef },
  ): KrnOverlayRef<Result, KrnOverlayDismissReason | CustomDismissReason>;
  open<Data, Result = void, CustomDismissReason extends string = never>(
    content:
      | Type<unknown>
      | TemplateRef<
          KrnOverlayTemplateContext<Data, Result, KrnOverlayDismissReason | CustomDismissReason>
        >,
    config: KrnOverlayBaseConfig & { readonly data?: Data } = {},
  ): KrnOverlayRef<Result, KrnOverlayDismissReason | CustomDismissReason> {
    const ref = new KrnOverlayRefImpl(this.ids.next('programmatic-overlay'));
    const publicRef = ref as unknown as KrnOverlayRef<
      Result,
      KrnOverlayDismissReason | CustomDismissReason
    >;

    if (!this.platform.isBrowser) {
      ref.bind(() => ref.finalize());
      ref.dismiss('ssr');
      return publicRef;
    }

    if (content instanceof TemplateRef && !config.viewContainerRef) {
      throw new Error('KrnOverlayService: TemplateRef content requires viewContainerRef.');
    }

    const normalized = this.normalizeConfig(config);
    const parentInjector = config.injector ?? config.viewContainerRef?.injector ?? this.injector;
    const parentRef = parentInjector.get(KrnOverlayRef, null) as KrnOverlayRefImpl | null;
    const parent = parentRef ? (this.records.get(parentRef.id) ?? null) : null;
    if (parent && !parent.ref.acceptsChildren()) {
      ref.bind(() => ref.finalize());
      ref.dismiss('parent');
      return publicRef;
    }
    const hostInjector = Injector.create({
      name: `KrnProgrammaticOverlayHost(${ref.id})`,
      parent: this.injector,
      providers: [
        { provide: KRN_PROGRAMMATIC_OVERLAY_CONFIG, useValue: normalized },
        { provide: KrnOverlayRef, useValue: publicRef },
      ],
    });
    const contentInjector = Injector.create({
      name: `KrnProgrammaticOverlayContent(${ref.id})`,
      parent: parentInjector,
      providers: [
        ...(config.providers ?? []),
        { provide: KRN_OVERLAY_DATA, useValue: config.data },
        { provide: KrnOverlayRef, useValue: publicRef },
      ] as StaticProvider[],
    });
    const overlay = this.injector.get(Overlay);
    const overlayRef = overlay.create({
      disposeOnNavigation: false,
      hasBackdrop: false,
      height: '100%',
      panelClass: ['krn-overlay-pane', 'krn-programmatic-overlay-pane'],
      positionStrategy: overlay.position().global().top('0').left('0'),
      scrollStrategy: overlay.scrollStrategies.noop(),
      usePopover: false,
      width: '100%',
    });

    let hostRef: ComponentRef<KrnProgrammaticOverlayHost> | null = null;
    let record: ActiveOverlayRecord | null = null;
    try {
      hostRef = overlayRef.attach(
        new ComponentPortal(KrnProgrammaticOverlayHost, null, hostInjector),
      );
      hostRef.changeDetectorRef.detectChanges();
      record = {
        ref,
        overlayRef,
        hostRef,
        hostInjector,
        contentInjector,
        subscriptions: [],
        children: new Set<ActiveOverlayRecord>(),
        parent,
        removeNavigationListener: null,
        exitRequested: false,
        exitStarted: false,
        suppressFocusRestore: false,
        surfaceExited: false,
        finalizeScheduled: false,
        finalizing: false,
      };
      const activeRecord = record;
      this.records.set(ref.id, activeRecord);
      parent?.children.add(activeRecord);
      ref.bind((outcome) => this.beginExit(activeRecord, outcome));

      activeRecord.subscriptions.push(
        hostRef.instance.dismissRequested.subscribe((reason) => ref.dismiss(reason)),
        hostRef.instance.afterExited.subscribe(() => {
          activeRecord.surfaceExited = true;
          this.maybeFinalize(activeRecord);
        }),
        overlayRef.detachments().subscribe(() => {
          if (activeRecord.finalizing) return;
          ref.dismiss('destroy');
          activeRecord.surfaceExited = true;
          this.maybeFinalize(activeRecord);
        }),
      );
      hostRef.onDestroy(() => {
        if (activeRecord.finalizing) return;
        ref.dismiss('destroy');
        activeRecord.surfaceExited = true;
        this.maybeFinalize(activeRecord);
      });

      const outlet = hostRef.instance.portalOutlet();
      const attached =
        content instanceof TemplateRef
          ? outlet.attach(
              new TemplatePortal(
                content,
                config.viewContainerRef as ViewContainerRef,
                {
                  $implicit: config.data as Data,
                  data: config.data as Data,
                  overlayRef: publicRef,
                },
                contentInjector,
              ),
            )
          : outlet.attach(
              new ComponentPortal(content, config.viewContainerRef ?? null, contentInjector),
            );
      attached.onDestroy(() => {
        if (activeRecord.finalizing) return;
        ref.dismiss('destroy');
      });

      if (normalized.closeOnNavigation) {
        const location = this.injector.get(Location, null);
        activeRecord.removeNavigationListener =
          location?.onUrlChange(() => ref.dismiss('navigation')) ?? null;
      }
      return publicRef;
    } catch (error) {
      if (record) {
        this.records.delete(record.ref.id);
        record.parent?.children.delete(record);
      }
      overlayRef.dispose();
      contentInjector.destroy();
      hostInjector.destroy();
      throw error;
    }
  }

  private normalizeConfig(config: KrnOverlayBaseConfig): NormalizedOverlayConfig {
    return Object.freeze({
      variant: config.variant ?? 'dialog',
      title: config.title ?? '',
      description: config.description ?? '',
      ariaLabel: config.ariaLabel ?? this.translations.feedback.dialog,
      showClose: config.showClose ?? true,
      closeOnEscape: config.closeOnEscape ?? true,
      closeOnOutside: config.closeOnOutside ?? null,
      closeOnNavigation: config.closeOnNavigation ?? true,
      initialFocus: config.initialFocus ?? 'first-tabbable',
      restoreFocus: config.restoreFocus ?? null,
    });
  }

  private beginExit(
    record: ActiveOverlayRecord,
    outcome: KrnOverlayOutcome<unknown, string>,
  ): void {
    record.removeNavigationListener?.();
    record.removeNavigationListener = null;
    record.exitRequested = true;
    record.suppressFocusRestore =
      outcome.kind === 'dismissed' && (outcome.reason === 'parent' || outcome.reason === 'destroy');
    for (const child of [...record.children].reverse()) child.ref.dismiss('parent');

    if (this.destroying) {
      this.finalizeRecord(record);
      return;
    }

    this.startExit(record);
  }

  private startExit(record: ActiveOverlayRecord): void {
    if (
      !record.exitRequested ||
      record.exitStarted ||
      record.finalizing ||
      record.children.size > 0
    ) {
      return;
    }
    record.exitStarted = true;
    record.hostRef.instance.beginExit(record.suppressFocusRestore);
  }

  private maybeFinalize(record: ActiveOverlayRecord): void {
    if (
      record.finalizing ||
      record.finalizeScheduled ||
      !record.surfaceExited ||
      record.children.size > 0
    ) {
      return;
    }
    record.finalizeScheduled = true;
    this.platform.queueMicrotask(() => {
      record.finalizeScheduled = false;
      if (record.surfaceExited && record.children.size === 0) this.finalizeRecord(record);
    });
  }

  private finalizeRecord(record: ActiveOverlayRecord): void {
    if (record.finalizing || !this.records.has(record.ref.id)) return;
    record.finalizing = true;
    if (record.suppressFocusRestore && !record.hostRef.hostView.destroyed) {
      record.hostRef.instance.suppressFocusRestoration();
      record.hostRef.changeDetectorRef.detectChanges();
    }
    record.removeNavigationListener?.();
    record.removeNavigationListener = null;
    for (const subscription of record.subscriptions) subscription.unsubscribe();
    record.subscriptions.length = 0;
    record.overlayRef.dispose();
    record.contentInjector.destroy();
    record.hostInjector.destroy();
    this.records.delete(record.ref.id);
    const parent = record.parent;
    parent?.children.delete(record);
    record.parent = null;
    record.ref.finalize();
    if (parent) {
      this.startExit(parent);
      this.maybeFinalize(parent);
    }
  }
}
