import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnFormField } from './form-field';
import { KrnTagsInput } from './otp-tags';

@Component({
  imports: [KrnFormField, KrnTagsInput],
  template: `
    <span id="external-tags-label">External tags label</span>
    <span id="external-tags-help">Separate tags with commas.</span>
    <krn-form-field label="Topics" hint="Add at most three topics.">
      <krn-tags-input
        id="topics"
        ariaDescribedBy="external-tags-help"
        ariaLabelledBy="external-tags-label"
        [maxTags]="3"
        [required]="true"
        tabindex="3"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class TagsHost {
  readonly value = signal<readonly string[]>(['Angular']);
  readonly tags = viewChild.required(KrnTagsInput);
}

@Component({
  imports: [KrnTagsInput, ReactiveFormsModule],
  template: `<krn-tags-input [formControl]="control" />`,
})
class BlurUpdateHost {
  readonly control = new FormControl<readonly string[]>([], {
    nonNullable: true,
    updateOn: 'blur',
  });
}

const nativeInput = (root: HTMLElement): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>('.krn-tag-input > input');
  if (!input) {
    throw new Error('Expected the tags native input.');
  }
  return input;
};

describe('KrnTagsInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value silently and commits a separated batch once', async () => {
    const fixture = TestBed.createComponent(TagsHost);
    await fixture.whenStable();
    const component = fixture.componentInstance.tags();
    const valueChange = vi.fn();
    const tagAdded = vi.fn();
    component.valueChange.subscribe(valueChange);
    component.tagAdded.subscribe(tagAdded);
    const input = nativeInput(fixture.nativeElement);

    fixture.componentInstance.value.set(['React']);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.krn-token')?.textContent).toContain('React');
    expect(valueChange).not.toHaveBeenCalled();

    input.value = 'Vue, Svelte, Vue';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toEqual(['React', 'Vue', 'Svelte']);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenCalledWith(['React', 'Vue', 'Svelte']);
    expect(tagAdded.mock.calls).toEqual([['Vue'], ['Svelte']]);
    expect(input.value).toBe('');

    input.value = 'Vue';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('composes explicit and Form Field semantics on the group and native input', async () => {
    const fixture = TestBed.createComponent(TagsHost);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const group = root.querySelector<HTMLElement>('[role="group"]')!;
    const input = nativeInput(root);

    expect(group.getAttribute('aria-labelledby')).toBe('external-tags-label topics-field-label');
    expect(group.hasAttribute('aria-label')).toBe(false);
    expect(input.getAttribute('aria-labelledby')).toBe('external-tags-label topics-field-label');
    expect(input.getAttribute('aria-describedby')).toBe('external-tags-help topics-hint');
    expect(input.id).toBe('topics');
    expect(input.required).toBe(false);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.tabIndex).toBe(3);
  });

  it('does not commit on an internal blur or an IME separator key', async () => {
    const fixture = TestBed.createComponent(KrnTagsInput);
    const change = vi.fn();
    const touched = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.registerOnTouched(touched);
    fixture.componentInstance.writeValue(['Angular']);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = nativeInput(root);
    const remove = root.querySelector<HTMLButtonElement>('.krn-token__remove')!;

    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: remove }));
    expect(touched).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(input.value).toBe('draft');

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        isComposing: true,
        key: 'Enter',
      }),
    );
    expect(change).not.toHaveBeenCalled();

    const outside = document.createElement('button');
    remove.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
    expect(touched).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledWith(['Angular', 'draft']);
  });

  it('commits the current draft before touching an updateOn-blur form control', async () => {
    const fixture = TestBed.createComponent(BlurUpdateHost);
    await fixture.whenStable();
    const input = nativeInput(fixture.nativeElement);

    input.focus();
    input.value = 'Angular';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fixture.componentInstance.control.value).toEqual([]);

    input.blur();
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toEqual(['Angular']);
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('returns focus to the input after removing a focused tag', async () => {
    const fixture = TestBed.createComponent(KrnTagsInput);
    const change = vi.fn();
    const valueChange = vi.fn();
    const tagRemoved = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.writeValue(['Angular', 'KERN']);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.componentInstance.tagRemoved.subscribe(tagRemoved);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = nativeInput(root);
    const remove = root.querySelector<HTMLButtonElement>('.krn-token__remove')!;

    remove.focus();
    remove.click();
    await fixture.whenStable();

    expect(change).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledWith(['KERN']);
    expect(valueChange).toHaveBeenCalledWith(['KERN']);
    expect(tagRemoved).toHaveBeenCalledWith('Angular');
    expect(input.ownerDocument.activeElement).toBe(input);
  });
});
