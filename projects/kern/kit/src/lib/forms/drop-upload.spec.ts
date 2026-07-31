import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFormField } from './form-field';
import { KrnDropUpload } from './upload-controls';

@Component({
  imports: [KrnDropUpload, KrnFormField],
  template: `
    <span id="external-drop-label">External evidence name</span>
    <span id="external-drop-help">External evidence help.</span>
    <krn-form-field label="Evidence" hint="Attach supporting evidence.">
      <krn-drag-drop-upload
        id="evidence"
        accept=".pdf"
        ariaDescribedBy="external-drop-help"
        ariaLabelledBy="external-drop-label"
        description="PDF documents only."
        dropLabel="Drop evidence here"
        multiple
        required
        tabindex="5"
        [disabled]="disabled()"
        [readonly]="readOnly()"
        [value]="value()"
        (filesChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class DropUploadHost {
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly value = signal<readonly File[]>([
    new File(['first'], 'first.pdf', {
      lastModified: 1,
      type: 'application/pdf',
    }),
  ]);
  readonly upload = viewChild.required(KrnDropUpload);
}

interface MutableDataTransfer {
  dropEffect: DataTransfer['dropEffect'];
  readonly files: readonly File[];
}

const dispatchDrag = (
  target: HTMLElement,
  type: 'dragleave' | 'dragover' | 'drop',
  dataTransfer: MutableDataTransfer,
  relatedTarget: EventTarget | null = null,
): Event => {
  const view = target.ownerDocument.defaultView!;
  const event = new view.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: dataTransfer },
    relatedTarget: { value: relatedTarget },
  });
  target.dispatchEvent(event);
  return event;
};

const uploadAction = (root: HTMLElement): HTMLButtonElement => {
  const action = root.querySelector<HTMLButtonElement>('.krn-upload__button');
  if (!action) {
    throw new Error('Expected the Drop Upload action.');
  }
  return action;
};

describe('KrnDropUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone file list and commits an accepted drop once', async () => {
    const fixture = TestBed.createComponent(DropUploadHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.upload();
    const filesChange = vi.fn();
    component.filesChange.subscribe(filesChange);
    const zone = fixture.nativeElement.querySelector('.krn-upload') as HTMLElement;
    const incoming = new File(['second'], 'second.pdf', {
      lastModified: 2,
      type: 'application/pdf',
    });
    const dataTransfer: MutableDataTransfer = {
      dropEffect: 'none',
      files: [incoming],
    };

    const over = dispatchDrag(zone, 'dragover', dataTransfer);
    await fixture.whenStable();
    expect(over.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe('copy');
    expect(zone.getAttribute('data-dragging')).toBe('true');

    const drop = dispatchDrag(zone, 'drop', dataTransfer);
    await fixture.whenStable();
    expect(drop.defaultPrevented).toBe(true);
    expect(zone.getAttribute('data-dragging')).toBe('false');
    expect(host.value().map((file) => file.name)).toEqual(['first.pdf', 'second.pdf']);
    expect(filesChange).toHaveBeenCalledOnce();

    host.value.set([
      new File(['external'], 'external.pdf', {
        lastModified: 3,
        type: 'application/pdf',
      }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(filesChange).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.krn-file-name')?.textContent).toBe('external.pdf');
  });

  it('keeps nested drag transitions active and resets blocked drag state', async () => {
    const fixture = TestBed.createComponent(DropUploadHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const zone = fixture.nativeElement.querySelector('.krn-upload') as HTMLElement;
    const child = zone.querySelector('strong') as HTMLElement;
    const dataTransfer: MutableDataTransfer = { dropEffect: 'none', files: [] };

    dispatchDrag(zone, 'dragover', dataTransfer);
    await fixture.whenStable();
    dispatchDrag(zone, 'dragleave', dataTransfer, child);
    await fixture.whenStable();
    expect(zone.getAttribute('data-dragging')).toBe('true');

    host.readOnly.set(true);
    await fixture.whenStable();
    expect(zone.getAttribute('data-dragging')).toBe('false');
    dataTransfer.dropEffect = 'copy';
    dispatchDrag(zone, 'dragover', dataTransfer);
    await fixture.whenStable();
    expect(dataTransfer.dropEffect).toBe('none');
    expect(zone.getAttribute('data-dragging')).toBe('false');
  });

  it('uses one visible focus target and composes drop, local, and Form Field semantics', async () => {
    const fixture = TestBed.createComponent(DropUploadHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.upload();
    const action = uploadAction(fixture.nativeElement);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    expect(action.id).toBe('evidence');
    expect(action.getAttribute('aria-labelledby')).toBe('external-drop-label evidence-field-label');
    expect(action.getAttribute('aria-describedby')).toBe(
      'external-drop-help evidence-hint evidence-drop-label evidence-description evidence-required',
    );
    expect(action.tabIndex).toBe(5);
    expect(input.id).toBe('evidence-native');
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');

    component.focus({ preventScroll: true });
    expect(action.ownerDocument.activeElement).toBe(action);
    component.blur();
    expect(action.ownerDocument.activeElement).not.toBe(action);

    const inputClick = vi.spyOn(input, 'click');
    host.readOnly.set(true);
    await fixture.whenStable();
    expect(action.disabled).toBe(false);
    expect(action.getAttribute('aria-disabled')).toBe('true');
    action.click();
    expect(inputClick).not.toHaveBeenCalled();

    host.disabled.set(true);
    await fixture.whenStable();
    expect(action.disabled).toBe(true);
    expect(action.tabIndex).toBe(-1);
  });

  it('marks the control touched when its single visible action loses focus', async () => {
    const fixture = TestBed.createComponent(KrnDropUpload);
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();

    fixture.componentInstance.focus();
    fixture.componentInstance.blur();
    expect(touched).toHaveBeenCalledOnce();
  });
});
