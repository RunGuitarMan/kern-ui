import { TestBed } from '@angular/core/testing';

import {
  KERN_DOCS_RELEASE_STATE,
  KERN_DOCS_RELEASE_STATE_LABEL,
  KERN_DOCS_VERSION,
  KERN_DOCS_VERSION_LABEL,
} from '../release-identity';
import { ChangelogPage } from './changelog';

describe('ChangelogPage', () => {
  it('renders the package-aligned version and explicit publication state', async () => {
    await TestBed.configureTestingModule({
      imports: [ChangelogPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ChangelogPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).toContain(KERN_DOCS_VERSION_LABEL);
    expect(content).toContain(`Version ${KERN_DOCS_VERSION}`);
    expect(content).toContain(KERN_DOCS_RELEASE_STATE_LABEL);
    if (KERN_DOCS_RELEASE_STATE === 'source-candidate') {
      expect(content).toContain('Unpublished source candidate');
      expect(content).not.toContain('Current release');
    }
  });
});
