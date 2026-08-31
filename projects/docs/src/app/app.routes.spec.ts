import { KERN_CATALOG_ALIASES } from '@kern-ui/showcase/catalog-index';

import { componentAliasRoutes, routes } from './app.routes';

describe('documentation routes', () => {
  it('redirects every legacy alias to its canonical component page', () => {
    expect(componentAliasRoutes).toHaveLength(Object.keys(KERN_CATALOG_ALIASES).length);

    for (const [alias, canonical] of Object.entries(KERN_CATALOG_ALIASES)) {
      expect(componentAliasRoutes).toContainEqual({
        path: `components/${alias}`,
        redirectTo: `/components/${canonical}`,
        pathMatch: 'full',
      });
    }
  });

  it('matches alias redirects before the parameterized component route', () => {
    const componentRouteIndex = routes.findIndex((route) => route.path === 'components/:id');
    expect(componentRouteIndex).toBeGreaterThan(-1);

    for (const aliasRoute of componentAliasRoutes) {
      expect(routes.indexOf(aliasRoute)).toBeLessThan(componentRouteIndex);
    }
  });
});
