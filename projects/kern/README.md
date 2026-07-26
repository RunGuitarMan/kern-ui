# @kern-ui/angular

Kern is an accessible, token-driven Angular component library for production product
interfaces. It uses standalone components, signals, typed forms, Angular CDK/Aria, logical CSS
properties, SSR-safe platform access, and a tree-shakeable public API.

## Install

```bash
npm install @kern-ui/angular @angular/cdk @angular/aria
```

```css
@import '@kern-ui/angular/styles/kern.css';
```

```ts
import { provideKrnTheme } from '@kern-ui/angular';

export const appConfig = {
  providers: [provideKrnTheme({ theme: 'system', density: 'comfortable' })],
};
```

Every component is exported from `@kern-ui/angular`. Forms controls implement Angular Forms
contracts; overlays use focus management and restore focus; theme tokens are available as CSS
custom properties and through the typed `krnTokens`/`KRN_TOKEN_NAMES` APIs.

See the workspace [README](../../README.md) and
[component inventory](../../docs/COMPONENTS.md) for usage, development, and coverage details.
