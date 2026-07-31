import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFileUpload } from '../../public-api';
import { KrnFileUploadHarness } from '../../../testing/src/public-api';

@Component({
  imports: [KrnFileUpload],
  template: `
    <krn-file-upload
      accept=".txt"
      label="Attach logs"
      multiple
      [disabled]="disabled()"
      [readonly]="readOnly()"
    />
  `,
})
class FileUploadHarnessHost {
  readonly disabled = signal(false);
  readonly readOnly = signal(true);
}

describe('KrnFileUploadHarness', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('filters state and focuses the visible upload action', async () => {
    const fixture = TestBed.createComponent(FileUploadHarnessHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const upload = await loader.getHarness(
      KrnFileUploadHarness.with({
        accept: '.txt',
        disabled: false,
        label: 'Attach logs',
        multiple: true,
        readonly: true,
      }),
    );

    expect(await upload.isReadonly()).toBe(true);
    expect(await upload.isDisabled()).toBe(false);
    await upload.focus();
    expect(await upload.isFocused()).toBe(true);

    fixture.componentInstance.readOnly.set(false);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(await upload.isReadonly()).toBe(false);
    expect(await upload.isDisabled()).toBe(true);
  });
});
