import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnOtpInput } from '../../public-api';
import { KrnFormControlHarness } from '../../../testing/src/public-api';

@Component({
  imports: [KrnOtpInput],
  template: `
    <krn-verification-code
      label="Security code"
      required
      [readonly]="readOnly()"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class OtpHarnessHost {
  readonly readOnly = signal(true);
  readonly value = signal('12');
}

describe('KrnFormControlHarness with KrnOtpInput', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('finds the documented alias and exposes native input state and interaction', async () => {
    const fixture = TestBed.createComponent(OtpHarnessHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const otp = await loader.getHarness(
      KrnFormControlHarness.with({
        disabled: false,
        readonly: true,
        required: true,
        value: '12',
      }),
    );

    expect(await otp.getInputType()).toBe('text');
    expect(await otp.isReadonly()).toBe(true);
    await otp.focus();
    expect(await otp.isFocused()).toBe(true);

    fixture.componentInstance.readOnly.set(false);
    await fixture.whenStable();
    await otp.setValue('123456');
    expect(await otp.getValue()).toBe('123456');
    expect(fixture.componentInstance.value()).toBe('123456');
  });
});
