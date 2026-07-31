import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findAngularSelectorStart } from './angular-selector.mjs';

describe('Angular selector lookup', () => {
  const template = `
    <button krnButton type="button">Text action</button>
    @case ('icon-button') {
      <button
        krnIconButton
        type="button"
        aria-label="Create > workspace"
      >+</button>
    }
    @case ('tooltip') {
      <button krnIconButton [krnTooltip]="'Copy'">↗</button>
    }
  `;

  it('matches native hosts with compound directive selectors', () => {
    const caseStart = template.indexOf("@case ('icon-button')");
    const caseEnd = template.indexOf("@case ('tooltip')");
    const result = findAngularSelectorStart(template, 'button[krnIconButton]', caseStart, caseEnd);

    assert.equal(result, template.indexOf('<button', caseStart));
  });

  it('matches attribute-only selectors and respects segment boundaries', () => {
    const tooltipStart = template.indexOf("@case ('tooltip')");

    assert.equal(
      findAngularSelectorStart(template, '[krnTooltip]', tooltipStart),
      template.indexOf('<button', tooltipStart),
    );
    assert.equal(
      findAngularSelectorStart(template, 'button[krnIconButton]', 0, tooltipStart),
      template.indexOf('<button', template.indexOf("@case ('icon-button')")),
    );
  });

  it('supports exact attribute values and rejects unsupported selector syntax', () => {
    assert.equal(
      findAngularSelectorStart(template, 'button[type="button"]'),
      template.indexOf('<button'),
    );
    assert.throws(
      () => findAngularSelectorStart(template, 'button.krn-icon-button'),
      /Unsupported Angular selector/,
    );
  });
});
