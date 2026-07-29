/**
 * Command shortcut hint
 *
 * Expose the ordered keys for a common command.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnKeyboardShortcut } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-keyboard-shortcut-agent-example',
  standalone: true,
  imports: [KrnKeyboardShortcut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-keyboard-shortcut [keys]="shortcut" /> `,
})
export class KernKeyboardShortcutAgentExample {
  readonly shortcut: readonly string[] = ['Ctrl', 'K'];
}

void bootstrapApplication(KernKeyboardShortcutAgentExample);
