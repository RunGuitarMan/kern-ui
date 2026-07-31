import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnDropUpload } from '../../public-api';
import { KrnDropUploadHarness } from '../../../testing/src/public-api';

@Component({
  imports: [KrnDropUpload],
  template: `
    <krn-drag-drop-upload
      accept=".pdf"
      dropLabel="Drop reports here"
      label="Browse reports"
      multiple
      [disabled]="disabled()"
      [readonly]="readOnly()"
    />
  `,
})
class DropUploadHarnessHost {
  readonly disabled = signal(false);
  readonly readOnly = signal(true);
}

describe('KrnDropUploadHarness', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('filters drag-and-drop copy and state and focuses the visible action', async () => {
    const fixture = TestBed.createComponent(DropUploadHarnessHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const upload = await loader.getHarness(
      KrnDropUploadHarness.with({
        accept: '.pdf',
        disabled: false,
        dropLabel: 'Drop reports here',
        label: 'Browse reports',
        multiple: true,
        readonly: true,
      }),
    );

    expect(await upload.getDropLabel()).toBe('Drop reports here');
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
