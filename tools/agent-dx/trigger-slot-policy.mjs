import { parseTemplate } from '@angular/compiler';

const internalButtonTriggerSlots = new Set([
  'krnHoverCardTrigger',
  'krnMenuTrigger',
  'krnPopoverTrigger',
]);
const interactiveAttributes = new Set(['krnButtonGroup', 'krnToggleGroup']);
const interactiveElements = new Set([
  'a',
  'button',
  'input',
  'krn-accordion',
  'krn-alert-dialog',
  'krn-autocomplete',
  'krn-back-button',
  'krn-bottom-navigation',
  'krn-bottom-sheet',
  'krn-breadcrumbs',
  'krn-bulk-actions',
  'krn-calendar',
  'krn-checkbox',
  'krn-checkbox-group',
  'krn-color-picker',
  'krn-combobox',
  'krn-command-palette',
  'krn-confirmation-pattern',
  'krn-context-menu',
  'krn-copy-button',
  'krn-crud-toolbar',
  'krn-data-grid',
  'krn-data-table',
  'krn-date-picker',
  'krn-date-range-picker',
  'krn-dialog',
  'krn-disclosure',
  'krn-drag-drop-upload',
  'krn-drawer',
  'krn-dropdown-button',
  'krn-file-upload',
  'krn-filter-bar',
  'krn-global-search',
  'krn-login-form',
  'krn-menu',
  'krn-menubar',
  'krn-mobile-navigation',
  'krn-multi-step-form',
  'krn-multi-select',
  'krn-native-select',
  'krn-navigation-rail',
  'krn-number-input',
  'krn-notification-center',
  'krn-pagination',
  'krn-password-input',
  'krn-popover',
  'krn-profile-form',
  'krn-radio',
  'krn-radio-group',
  'krn-range-slider',
  'krn-rating',
  'krn-resizable-panels',
  'krn-search-input',
  'krn-select',
  'krn-segmented-control',
  'krn-settings-panel',
  'krn-skip-link',
  'krn-slider',
  'krn-split-button',
  'krn-stepper',
  'krn-switch',
  'krn-table-of-contents',
  'krn-tabs',
  'krn-tags-input',
  'krn-text-input',
  'krn-textarea',
  'krn-time-picker',
  'krn-tree',
  'krn-tree-navigation',
  'krn-user-menu',
  'krn-verification-code',
  'krn-vertical-tabs',
  'select',
  'textarea',
]);

function elementAttributes(node) {
  return Array.isArray(node?.attributes) ? node.attributes.map((attribute) => attribute.name) : [];
}

function descendantInteractiveElements(node) {
  const matches = [];
  const visit = (candidate) => {
    if (typeof candidate?.name === 'string' && interactiveElements.has(candidate.name)) {
      matches.push(candidate.name);
    }
    for (const attribute of elementAttributes(candidate)) {
      if (interactiveAttributes.has(attribute)) {
        matches.push(`[${attribute}]`);
      }
    }
    for (const child of candidate?.children ?? []) visit(child);
  };
  visit(node);
  return matches;
}

/**
 * Finds projected trigger content that would be nested inside a KERN-owned native button.
 *
 * Popover, Hover Card, and Menu own the outer button semantics, keyboard behavior, focus target,
 * and ARIA state. Their named trigger slots therefore accept label content, not another
 * interactive control.
 */
export function internalButtonTriggerViolations(template, sourceName = 'inline-template') {
  const parsed = parseTemplate(template, sourceName, {
    preserveWhitespaces: false,
    preserveLineEndings: true,
  });
  if (parsed.errors?.length) {
    return parsed.errors.map((error) => ({
      slot: 'template',
      element: 'parse-error',
      message: error.toString(),
    }));
  }

  const violations = [];
  const visit = (node) => {
    if (typeof node?.name === 'string') {
      const slot = elementAttributes(node).find((name) => internalButtonTriggerSlots.has(name));
      if (slot) {
        for (const element of descendantInteractiveElements(node)) {
          violations.push({
            slot,
            element,
            message:
              `${slot} is projected into a KERN-owned button; use non-interactive label content ` +
              `instead of <${element}>.`,
          });
        }
      }
    }
    for (const child of node?.children ?? []) visit(child);
  };
  for (const node of parsed.nodes) visit(node);
  return violations;
}
