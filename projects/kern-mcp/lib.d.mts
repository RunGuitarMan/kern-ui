export type KrnMcpLifecycleStatus = 'stable' | 'beta' | 'experimental' | 'recipe' | 'deprecated';

export interface KrnMcpFrameworkContract {
  readonly name: string;
  readonly peerRange: string;
}

export interface KrnMcpLibraryContract {
  readonly package: string;
  readonly version: string;
  readonly framework: KrnMcpFrameworkContract;
  readonly requiredStyles: string;
  readonly configuration: unknown;
  readonly entrypoints: readonly string[];
  readonly [key: string]: unknown;
}

export interface KrnMcpAliases {
  readonly symbols: readonly string[];
  readonly selectors: readonly string[];
  readonly componentIds: readonly string[];
}

export interface KrnMcpComponentContract {
  readonly id: string;
  readonly name: string;
  readonly selector: string;
  readonly symbol: string;
  readonly canonicalSymbol: string;
  readonly importPath: string;
  readonly category: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly related: readonly string[];
  readonly aliases: KrnMcpAliases;
  readonly lifecycle: {
    readonly status: KrnMcpLifecycleStatus;
    readonly [key: string]: unknown;
  };
  readonly guidance: {
    readonly useWhen: string;
    readonly avoidWhen: string;
    readonly [key: string]: unknown;
  };
  readonly documentation: {
    readonly markdown: string;
    readonly [key: string]: unknown;
  };
  readonly examples: readonly { readonly id: string; readonly [key: string]: unknown }[];
  readonly api: readonly {
    readonly name: string;
    readonly kind: string;
    readonly required?: boolean;
    readonly [key: string]: unknown;
  }[];
  readonly forms: {
    readonly controlValueAccessor?: boolean;
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export interface KrnMcpSymbolContract {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly [key: string]: unknown;
}

export interface KrnMcpRecipeContract {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly components: readonly string[];
  readonly [key: string]: unknown;
}

export interface KrnMcpMigrationContract {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly components: readonly string[];
  readonly [key: string]: unknown;
}

export interface KrnMcpManifest {
  readonly schemaVersion: string;
  readonly library: KrnMcpLibraryContract;
  readonly components: readonly KrnMcpComponentContract[];
  readonly symbols: readonly KrnMcpSymbolContract[];
  readonly recipes: readonly KrnMcpRecipeContract[];
  readonly migrations: readonly KrnMcpMigrationContract[];
  readonly [key: string]: unknown;
}

export interface KrnMcpTextContent {
  readonly type: 'text';
  readonly text: string;
}

export interface KrnMcpToolResult<T = unknown> {
  readonly content: readonly KrnMcpTextContent[];
  readonly structuredContent: T;
  readonly isError?: true;
}

export interface KrnMcpSearchArguments {
  readonly query?: string;
  readonly category?: string;
  readonly lifecycle?: KrnMcpLifecycleStatus;
  readonly limit?: number;
}

export interface KrnMcpSearchResult {
  readonly query: string;
  readonly total: number;
  readonly results: readonly {
    readonly id: string;
    readonly name: string;
    readonly selector: string;
    readonly symbol: string;
    readonly importPath: string;
    readonly category: string;
    readonly lifecycle: KrnMcpLifecycleStatus;
    readonly summary: string;
    readonly related: readonly string[];
  }[];
}

export interface KrnMcpOverview {
  readonly package: string;
  readonly version: string;
  readonly schemaVersion: string;
  readonly framework: KrnMcpFrameworkContract;
  readonly requiredStyles: string;
  readonly configuration: unknown;
  readonly entrypoints: readonly string[];
  readonly totals: {
    readonly components: number;
    readonly publicSymbolGroups: number;
    readonly recipes: number;
    readonly migrations: number;
  };
  readonly lifecycle: Readonly<Record<KrnMcpLifecycleStatus, number>>;
  readonly categories: Readonly<Record<string, number>>;
  readonly startHere: readonly string[];
}

export type KrnMcpToolName =
  | 'get_overview'
  | 'search_components'
  | 'get_component_contract'
  | 'get_example'
  | 'get_recipe'
  | 'get_migration'
  | 'validate_usage';

export interface KrnMcpToolDefinition {
  readonly name: KrnMcpToolName;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
}

export interface KrnMcpAgentApi {
  readonly manifest: KrnMcpManifest;
  readonly componentLookup: ReadonlyMap<string, KrnMcpComponentContract>;
  readonly symbolLookup: ReadonlyMap<string, KrnMcpSymbolContract>;
  readonly getOverview: () => KrnMcpOverview;
  readonly searchComponents: (arguments_?: KrnMcpSearchArguments) => KrnMcpSearchResult;
  readonly resolveComponent: (reference: string) => KrnMcpComponentContract | undefined;
  readonly callTool: (
    name: KrnMcpToolName | (string & Record<never, never>),
    arguments_?: Readonly<Record<string, unknown>>,
  ) => KrnMcpToolResult;
}

export function loadManifest(path: string | URL): Promise<KrnMcpManifest>;
export function createKernAgentApi(manifest: KrnMcpManifest): KrnMcpAgentApi;
export const toolDefinitions: readonly KrnMcpToolDefinition[];
