export const KERN_DOCS_VERSION = '0.1.0' as const;
export const KERN_DOCS_VERSION_LABEL = `v${KERN_DOCS_VERSION}`;

export type KernDocsReleaseState = 'source-candidate' | 'released';

export const KERN_DOCS_RELEASE_STATE: KernDocsReleaseState = 'released';

const RELEASE_STATE_COPY: Readonly<
  Record<
    KernDocsReleaseState,
    {
      readonly label: string;
      readonly heading: string;
      readonly title: string;
    }
  >
> = {
  'source-candidate': {
    label: 'Unpublished source candidate',
    heading: 'Source candidate',
    title: 'Foundation source candidate',
  },
  released: {
    label: 'Released',
    heading: 'Current release',
    title: 'Foundation release',
  },
};

const KERN_DOCS_RELEASE_COPY = RELEASE_STATE_COPY[KERN_DOCS_RELEASE_STATE];

export const KERN_DOCS_RELEASE_STATE_LABEL = KERN_DOCS_RELEASE_COPY.label;
export const KERN_DOCS_RELEASE_HEADING = KERN_DOCS_RELEASE_COPY.heading;
export const KERN_DOCS_RELEASE_TITLE = KERN_DOCS_RELEASE_COPY.title;
