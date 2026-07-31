import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { KrnUploadRejection } from './form-types';
import { KrnFileUpload } from './upload-controls';
import { KrnFormField } from './form-field';

@Component({
  imports: [KrnFileUpload, KrnFormField],
  template: `
    <span id="external-upload-label">External attachment name</span>
    <span id="external-upload-help">External attachment help.</span>
    <krn-form-field label="Attachments" hint="Attach the relevant evidence.">
      <krn-file-upload
        id="attachments"
        accept=".txt"
        ariaDescribedBy="external-upload-help"
        ariaLabelledBy="external-upload-label"
        description="Text files only."
        multiple
        required
        tabindex="4"
        [disabled]="disabled()"
        [maxFiles]="3"
        [maxSize]="20"
        [readonly]="readOnly()"
        [value]="value()"
        (filesChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class FileUploadHost {
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly value = signal<readonly File[]>([
    new File(['first'], 'first.txt', {
      lastModified: 1,
      type: 'text/plain',
    }),
  ]);
  readonly upload = viewChild.required(KrnFileUpload);
}

const uploadAction = (root: HTMLElement): HTMLButtonElement => {
  const action = root.querySelector<HTMLButtonElement>('.krn-upload__button');
  if (!action) {
    throw new Error('Expected the File Upload action.');
  }
  return action;
};

const selectFiles = (input: HTMLInputElement, files: readonly File[]): void => {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
  const view = input.ownerDocument.defaultView!;
  input.dispatchEvent(new view.Event('change', { bubbles: true }));
};

describe('KrnFileUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone file list and emits only structurally changed accepted files', async () => {
    const fixture = TestBed.createComponent(FileUploadHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.upload();
    const filesChange = vi.fn();
    const rejected = vi.fn();
    component.filesChange.subscribe(filesChange);
    component.rejected.subscribe(rejected);
    const root = fixture.nativeElement as HTMLElement;
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    expect(
      [...root.querySelectorAll<HTMLElement>('.krn-file-name')].map(
        (element) => element.textContent,
      ),
    ).toEqual(['first.txt']);

    selectFiles(input, [
      new File(['other'], 'first.txt', {
        lastModified: 1,
        type: 'text/plain',
      }),
    ]);
    await fixture.whenStable();
    expect(filesChange).not.toHaveBeenCalled();

    selectFiles(input, [
      new File(['other'], 'first.txt', {
        lastModified: 1,
        type: 'application/octet-stream',
      }),
    ]);
    await fixture.whenStable();
    expect(host.value()).toHaveLength(2);
    expect(filesChange).toHaveBeenCalledOnce();

    selectFiles(input, [
      new File(['second'], 'second.txt', {
        lastModified: 2,
        type: 'text/plain',
      }),
    ]);
    await fixture.whenStable();
    expect(host.value().map((file) => file.name)).toEqual(['first.txt', 'first.txt', 'second.txt']);
    expect(filesChange).toHaveBeenCalledTimes(2);

    selectFiles(input, [
      new File(['second'], 'second.txt', {
        lastModified: 2,
        type: 'text/plain',
      }),
    ]);
    await fixture.whenStable();
    expect(filesChange).toHaveBeenCalledTimes(2);
    expect(rejected).not.toHaveBeenCalled();

    host.value.set([
      new File(['external'], 'external.txt', {
        lastModified: 3,
        type: 'text/plain',
      }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(filesChange).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.krn-file-name')?.textContent).toBe('external.txt');
  });

  it('keeps valid files while reporting type and size rejections', async () => {
    const fixture = TestBed.createComponent(FileUploadHost);
    fixture.componentInstance.value.set([]);
    await fixture.whenStable();
    const component = fixture.componentInstance.upload();
    const rejected = vi.fn();
    component.rejected.subscribe(rejected);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    selectFiles(input, [
      new File(['valid'], 'valid.txt', { lastModified: 1, type: 'text/plain' }),
      new File(['invalid'], 'invalid.png', { lastModified: 2, type: 'image/png' }),
      new File(['this file is too large'], 'large.txt', {
        lastModified: 3,
        type: 'text/plain',
      }),
    ]);
    await fixture.whenStable();

    expect(fixture.componentInstance.value().map((file) => file.name)).toEqual(['valid.txt']);
    expect(rejected).toHaveBeenCalledOnce();
    const rejections = rejected.mock.calls[0]?.[0] as readonly KrnUploadRejection[];
    expect(rejections.map((item) => item.reason)).toEqual(['type', 'size']);
    expect(
      [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          '.krn-rejection-list li',
        ),
      ].map((element) => element.textContent),
    ).toHaveLength(2);
  });

  it('uses one visible focus target and composes external, Form Field, and local semantics', async () => {
    const fixture = TestBed.createComponent(FileUploadHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.upload();
    const action = uploadAction(fixture.nativeElement);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    expect(action.id).toBe('attachments');
    expect(action.getAttribute('aria-labelledby')).toBe(
      'external-upload-label attachments-field-label',
    );
    expect(action.getAttribute('aria-describedby')).toBe(
      'external-upload-help attachments-hint attachments-description attachments-required',
    );
    expect(fixture.nativeElement.querySelector('#attachments-required')?.textContent?.trim()).toBe(
      'At least one file is required.',
    );
    expect(action.tabIndex).toBe(4);
    expect(input.id).toBe('attachments-native');
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
    expect(action.tabIndex).toBe(4);
    action.click();
    expect(inputClick).not.toHaveBeenCalled();

    host.disabled.set(true);
    await fixture.whenStable();
    expect(action.disabled).toBe(true);
    expect(action.tabIndex).toBe(-1);
  });

  it('marks the control touched when its single visible action loses focus', async () => {
    const fixture = TestBed.createComponent(KrnFileUpload);
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const action = uploadAction(fixture.nativeElement);

    fixture.componentInstance.focus();
    expect(action.ownerDocument.activeElement).toBe(action);
    fixture.componentInstance.blur();
    expect(touched).toHaveBeenCalledOnce();
  });
});
