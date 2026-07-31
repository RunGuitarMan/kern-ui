import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedContractPath = resolve(
  workspaceRoot,
  'projects/showcase/src/lib/generated-component-contract.ts',
);
const catalogPath = resolve(workspaceRoot, 'projects/showcase/src/lib/catalog.ts');
const playgroundPath = resolve(workspaceRoot, 'projects/showcase/specimen/src/lib/playground.ts');
const agentManifestPath = resolve(
  workspaceRoot,
  'metadata/agent/generated/component-manifest.json',
);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlaygroundValue(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function describeJsonDifference(expectedValue, actualValue) {
  const expected = JSON.stringify(expectedValue);
  const actual = JSON.stringify(actualValue);
  const limit = Math.min(expected.length, actual.length);
  let offset = 0;
  while (offset < limit && expected[offset] === actual[offset]) offset += 1;
  const start = Math.max(0, offset - 80);
  const end = offset + 160;
  return [
    `first difference at character ${offset}`,
    `registry: ${expected.slice(start, end)}`,
    `published: ${actual.slice(start, end)}`,
  ].join('\n');
}

async function evaluateTypeScript(filePath, dependencies = new Map()) {
  const source = await readFile(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filePath,
    reportDiagnostics: true,
  });
  const diagnostics = (result.diagnostics ?? []).filter(
    ({ category }) => category === ts.DiagnosticCategory.Error,
  );
  invariant(
    diagnostics.length === 0,
    `Unable to evaluate ${filePath}:\n${ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => workspaceRoot,
      getNewLine: () => '\n',
    })}`,
  );

  const module = { exports: {} };
  const localRequire = (specifier) => {
    invariant(
      dependencies.has(specifier),
      `${filePath} has an unexpected runtime dependency on ${JSON.stringify(specifier)}.`,
    );
    return dependencies.get(specifier);
  };
  const wrapper = new Script(`(function (require, module, exports) {\n${result.outputText}\n})`, {
    filename: filePath,
  }).runInThisContext();
  wrapper(localRequire, module, module.exports);
  return module.exports;
}

const generatedContract = await evaluateTypeScript(generatedContractPath);
const showcase = await evaluateTypeScript(
  catalogPath,
  new Map([['./generated-component-contract', generatedContract]]),
);
const playground = await evaluateTypeScript(
  playgroundPath,
  new Map([['@kern-ui/showcase', showcase]]),
);
const agentManifest = JSON.parse(await readFile(agentManifestPath, 'utf8'));

const catalog = showcase.KERN_CATALOG;
const definitions = playground.KERN_PLAYGROUND_DEFINITIONS;
const apiCoverage = playground.KERN_PLAYGROUND_API_COVERAGE;
const apiExclusions = playground.KERN_PLAYGROUND_API_EXCLUSIONS;
const autoControlKeys = playground.KERN_PLAYGROUND_AUTO_CONTROL_KEYS;
const normalizeApiType = playground.normalizeKernPlaygroundApiType;
const normalizeStateId = playground.normalizeKernPlaygroundStateId;
invariant(Array.isArray(catalog), 'KERN_CATALOG must be an array.');
invariant(Array.isArray(definitions), 'KERN_PLAYGROUND_DEFINITIONS must be an array.');
invariant(Array.isArray(apiExclusions), 'KERN_PLAYGROUND_API_EXCLUSIONS must be an array.');
invariant(isRecord(apiCoverage), 'KERN_PLAYGROUND_API_COVERAGE must be an object.');
invariant(isRecord(autoControlKeys), 'KERN_PLAYGROUND_AUTO_CONTROL_KEYS must be an object.');
invariant(
  typeof normalizeApiType === 'function',
  'normalizeKernPlaygroundApiType must be exported for registry tooling.',
);
invariant(
  typeof normalizeStateId === 'function',
  'normalizeKernPlaygroundStateId must be exported for agents and registry tooling.',
);
invariant(catalog.length === 131, `Expected 131 catalog components, received ${catalog.length}.`);
invariant(
  definitions.length === catalog.length,
  `Expected ${catalog.length} playground definitions, received ${definitions.length}.`,
);

const catalogById = new Map(catalog.map((item) => [item.id, item]));
invariant(
  catalogById.size === catalog.length,
  'KERN_CATALOG contains duplicate component identifiers.',
);
const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
invariant(
  definitionsById.size === definitions.length,
  'KERN_PLAYGROUND_DEFINITIONS contains duplicate component identifiers.',
);
const publishedById = new Map(
  (agentManifest.components ?? []).map((component) => [component.id, component.playground]),
);
invariant(
  publishedById.size === catalog.length,
  `Published agent manifest must contain playground metadata for ${catalog.length} components.`,
);

const allowedControlKinds = new Set(['boolean', 'number', 'range', 'select', 'text']);
const allowedBindingKinds = new Set(['input', 'model', 'fixture', 'composition']);
const allowedFixtureTargets = new Set(['data', 'overlay', 'content', 'interaction']);
const allowedExclusionCodes = new Set([
  'accessibility-copy',
  'callback',
  'complex-data',
  'dom-wiring',
  'form-serialization',
  'locale-environment',
  'polymorphic-value',
  'template',
  'translation-object',
]);
const allowedEvidenceCategories = new Set([
  'a11y-test',
  'component-example',
  'forms-integration',
  'locale-preview',
  'specimen-fixture',
]);
const allowedScenarios = new Set(['default', 'states', 'stress', 'virtual']);
const allowedPseudoStates = new Set(['hover', 'focus-visible', 'active']);
const allowedEnvironmentValues = {
  theme: new Set(['system', 'light', 'dark', 'high-contrast']),
  density: new Set(['compact', 'comfortable', 'spacious']),
  direction: new Set(['ltr', 'rtl']),
  viewport: new Set(['responsive', 'phone', 'tablet']),
};
const environmentStateExpectations = new Map([
  ['dark', ['theme', 'dark']],
  ['high-contrast', ['theme', 'high-contrast']],
  ['compact', ['density', 'compact']],
  ['rtl', ['direction', 'rtl']],
  ['mobile', ['viewport', 'phone']],
]);
const fixtureEffectModes = {
  layout: new Set(['alternate', 'constrained', 'expanded', 'overflow']),
  content: new Set(['alternate', 'empty', 'filled', 'long-text', 'with-action', 'without-action']),
  data: new Set([
    'alternate',
    'empty',
    'error',
    'filtered',
    'loading',
    'selected',
    'sorted',
    'success',
    'virtualized',
  ]),
  status: new Set(['danger', 'info', 'neutral', 'success', 'warning']),
};

let controlCount = 0;
let presetCount = 0;
let fixtureEffectCount = 0;
const bindingIssues = [];
const exclusionByApi = new Map();

for (const exclusion of apiExclusions) {
  const context = `${exclusion.componentId}.${exclusion.publicName}`;
  invariant(
    catalogById.has(exclusion.componentId),
    `${context}: exclusion references an unknown component.`,
  );
  invariant(
    typeof exclusion.publicName === 'string' && exclusion.publicName.length > 0,
    `${context}: exclusion requires an exact publicName.`,
  );
  invariant(
    exclusion.kind === 'input' || exclusion.kind === 'model',
    `${context}: exclusion kind must be input or model.`,
  );
  invariant(
    typeof exclusion.type === 'string' && exclusion.type.length > 0,
    `${context}: exclusion type is required.`,
  );
  invariant(
    allowedExclusionCodes.has(exclusion.code),
    `${context}: unsupported exclusion code ${String(exclusion.code)}.`,
  );
  invariant(
    typeof exclusion.reason === 'string' && exclusion.reason.length > 24,
    `${context}: exclusion requires a concrete rationale.`,
  );
  invariant(isRecord(exclusion.evidence), `${context}: exclusion evidence is required.`);
  invariant(
    allowedEvidenceCategories.has(exclusion.evidence.category),
    `${context}: unsupported evidence category.`,
  );
  invariant(
    typeof exclusion.evidence.pointer === 'string' &&
      exclusion.evidence.pointer.includes(exclusion.componentId),
    `${context}: evidence pointer must identify the exact component.`,
  );
  invariant(!exclusionByApi.has(context), `${context}: duplicate API exclusion.`);
  exclusionByApi.set(context, exclusion);
}

for (const item of catalog) {
  const definition = definitionsById.get(item.id);
  invariant(definition, `${item.id}: missing playground definition.`);
  const published = publishedById.get(item.id);
  invariant(published, `${item.id}: missing published agent playground contract.`);
  invariant(
    published.route === `preview/${item.id}`,
    `${item.id}: published agent playground route is stale.`,
  );
  for (const field of ['scenarios', 'controls', 'presets']) {
    if (JSON.stringify(published[field]) !== JSON.stringify(definition[field])) {
      throw new Error(
        `${item.id}: published agent playground ${field} differ from the executable registry.\n` +
          describeJsonDifference(definition[field], published[field]) +
          (field === 'controls'
            ? `\nregistry keys: ${definition.controls.map(({ key }) => key).join(', ')}` +
              `\npublished keys: ${published.controls.map(({ key }) => key).join(', ')}`
            : ''),
      );
    }
  }
  const itemExclusions = apiExclusions.filter(({ componentId }) => componentId === item.id);
  const publicApiMembers = item.api.filter(({ kind }) => kind === 'input' || kind === 'model');
  const publicControls = definition.controls.filter(
    ({ binding }) => binding.kind === 'input' || binding.kind === 'model',
  );
  const itemCoverage = {
    publicInputsAndModels: publicApiMembers.length,
    controlled: publicControls.length,
    excluded: itemExclusions.length,
    unclassified: publicApiMembers.length - publicControls.length - itemExclusions.length,
  };
  invariant(
    JSON.stringify(published.apiCoverage) === JSON.stringify(itemCoverage),
    `${item.id}: published API coverage is stale.`,
  );
  if (JSON.stringify(published.exclusions) !== JSON.stringify(itemExclusions)) {
    throw new Error(
      `${item.id}: published API exclusions are stale.\n` +
        describeJsonDifference(itemExclusions, published.exclusions),
    );
  }
  invariant(itemCoverage.unclassified === 0, `${item.id}: public API is not fully classified.`);

  const classificationByName = new Map();
  for (const control of publicControls) {
    const publicName = control.binding.publicName;
    const classifications = classificationByName.get(publicName) ?? [];
    classifications.push(`control:${control.key}`);
    classificationByName.set(publicName, classifications);
  }
  for (const exclusion of itemExclusions) {
    const classifications = classificationByName.get(exclusion.publicName) ?? [];
    classifications.push(`exclusion:${exclusion.code}`);
    classificationByName.set(exclusion.publicName, classifications);
  }
  for (const api of publicApiMembers) {
    const classifications = classificationByName.get(api.name) ?? [];
    invariant(
      classifications.length === 1,
      `${item.id}.${api.name}: expected exactly one control or exact exclusion; received ${classifications.join(', ') || 'none'}.`,
    );
    const exclusion = exclusionByApi.get(`${item.id}.${api.name}`);
    if (exclusion) {
      invariant(exclusion.kind === api.kind, `${item.id}.${api.name}: exclusion kind is stale.`);
      invariant(
        api.type === 'unknown' || exclusion.type === normalizeApiType(api.type),
        `${item.id}.${api.name}: exclusion type is stale.`,
      );
    }
  }
  invariant(
    Array.isArray(definition.scenarios) && definition.scenarios.length > 0,
    `${item.id}: scenarios must be a non-empty array.`,
  );
  invariant(
    definition.scenarios[0] === 'default',
    `${item.id}: the first scenario must be default.`,
  );
  invariant(
    new Set(definition.scenarios).size === definition.scenarios.length,
    `${item.id}: scenarios must be unique.`,
  );
  for (const scenario of definition.scenarios) {
    invariant(allowedScenarios.has(scenario), `${item.id}: unsupported scenario ${scenario}.`);
  }

  invariant(
    Array.isArray(definition.controls) && definition.controls.length > 0,
    `${item.id}: every catalog component must expose at least one live control.`,
  );
  invariant(
    definition.controls.some(({ binding }) => binding?.kind !== 'composition'),
    `${item.id}: canvas composition cannot be the component's only live control.`,
  );
  const controlByKey = new Map();
  for (const control of definition.controls) {
    const context = `${item.id}.${control.key ?? '<missing-key>'}`;
    invariant(
      typeof control.key === 'string' && control.key.length > 0,
      `${context}: control key is required.`,
    );
    invariant(!controlByKey.has(control.key), `${context}: duplicate control key.`);
    controlByKey.set(control.key, control);
    invariant(
      typeof control.label === 'string' && control.label.length > 0,
      `${context}: control label is required.`,
    );
    invariant(
      typeof control.description === 'string' && control.description.length > 0,
      `${context}: control description is required.`,
    );
    invariant(allowedControlKinds.has(control.kind), `${context}: unsupported control kind.`);
    invariant(
      isPlaygroundValue(control.defaultValue),
      `${context}: defaultValue must be null, a string, a number, or a boolean.`,
    );
    invariant(
      isPlaygroundValue(control.testValue),
      `${context}: testValue must be null, a string, a number, or a boolean.`,
    );
    invariant(
      !Object.is(control.testValue, control.defaultValue),
      `${context}: testValue must exercise a non-default state.`,
    );

    const binding = control.binding;
    invariant(isRecord(binding), `${context}: binding metadata is required.`);
    invariant(
      allowedBindingKinds.has(binding.kind),
      `${context}: binding.kind must identify a public input/model or an explicit fixture binding.`,
    );
    if (binding.kind === 'input' || binding.kind === 'model') {
      invariant(
        typeof binding.publicName === 'string' && binding.publicName.length > 0,
        `${context}: ${binding.kind} binding requires publicName.`,
      );
      const api = item.api.find(({ name }) => name === binding.publicName);
      if (!api) {
        bindingIssues.push(
          `${context}: ${binding.publicName} is not declared in the public ${item.selector} API.`,
        );
      } else if (api.kind !== binding.kind) {
        bindingIssues.push(
          `${context}: binding says ${binding.kind}, but ${binding.publicName} is a public ${api.kind}.`,
        );
      }
      if (binding.kind === 'input' && binding.syntax !== undefined) {
        invariant(
          binding.syntax === 'property' || binding.syntax === 'attribute',
          `${context}: input syntax must be property or attribute.`,
        );
      }
    } else if (binding.kind === 'fixture') {
      invariant(
        allowedFixtureTargets.has(binding.target),
        `${context}: fixture target must be data, overlay, content, or interaction.`,
      );
      invariant(
        typeof binding.description === 'string' && binding.description.length > 0,
        `${context}: fixture binding requires an implementation description.`,
      );
    } else {
      invariant(
        binding.target === 'canvas' && binding.attribute === 'data-composition',
        `${context}: composition bindings must target canvas[data-composition].`,
      );
    }

    if (control.kind === 'boolean') {
      invariant(typeof control.defaultValue === 'boolean', `${context}: boolean default required.`);
    }
    if (control.kind === 'text') {
      invariant(typeof control.defaultValue === 'string', `${context}: string default required.`);
      invariant(typeof control.testValue === 'string', `${context}: string test value required.`);
    }
    if (control.kind === 'select') {
      invariant(
        Array.isArray(control.options) && control.options.length > 1,
        `${context}: select controls require at least two options.`,
      );
      invariant(
        control.options.some(({ value }) => Object.is(value, control.defaultValue)),
        `${context}: select options must contain the default value.`,
      );
      invariant(
        control.options.some(({ value }) => Object.is(value, control.testValue)),
        `${context}: select options must contain the test value.`,
      );
    }
    if (control.kind === 'number' || control.kind === 'range') {
      invariant(typeof control.defaultValue === 'number', `${context}: numeric default required.`);
      invariant(
        typeof control.min === 'number' && typeof control.max === 'number',
        `${context}: numeric controls require finite bounds.`,
      );
      invariant(control.min <= control.defaultValue, `${context}: default is below min.`);
      invariant(control.defaultValue <= control.max, `${context}: default is above max.`);
      invariant(
        typeof control.testValue === 'number' &&
          control.min <= control.testValue &&
          control.testValue <= control.max,
        `${context}: numeric test value is outside its declared bounds.`,
      );
      invariant(
        typeof control.step === 'number' && control.step > 0,
        `${context}: step must be > 0.`,
      );
    }
  }
  controlCount += definition.controls.length;

  invariant(
    Array.isArray(definition.presets) && definition.presets.length > 0,
    `${item.id}: acceptance states must be represented by executable presets.`,
  );
  const presetById = new Map();
  for (const preset of definition.presets) {
    const context = `${item.id}.${preset.id ?? '<missing-preset-id>'}`;
    invariant(
      typeof preset.id === 'string' && preset.id.length > 0,
      `${context}: preset id is required.`,
    );
    invariant(
      preset.id === normalizeStateId(preset.id),
      `${context}: preset id must use normalizeKernPlaygroundStateId canonical form.`,
    );
    invariant(!presetById.has(preset.id), `${context}: duplicate preset id.`);
    presetById.set(preset.id, preset);
    invariant(
      typeof preset.label === 'string' && preset.label.length > 0,
      `${context}: preset label is required.`,
    );
    invariant(
      allowedScenarios.has(preset.scenario) && definition.scenarios.includes(preset.scenario),
      `${context}: preset scenario must be declared by its definition.`,
    );
    invariant(isRecord(preset.args), `${context}: preset args must be an object.`);
    for (const [key, value] of Object.entries(preset.args)) {
      invariant(controlByKey.has(key), `${context}: preset references unknown control ${key}.`);
      invariant(isPlaygroundValue(value), `${context}: preset arg ${key} is not serializable.`);
    }
    if (preset.visualPseudoState !== undefined) {
      invariant(
        allowedPseudoStates.has(preset.visualPseudoState),
        `${context}: unsupported visualPseudoState.`,
      );
    }
    const environment = preset.environment;
    if (environment !== undefined) {
      invariant(isRecord(environment), `${context}: environment must be an object.`);
      for (const [key, value] of Object.entries(environment)) {
        const supported = allowedEnvironmentValues[key];
        invariant(supported, `${context}: unsupported environment key ${key}.`);
        invariant(supported.has(value), `${context}: unsupported ${key} value ${value}.`);
      }
    }
    const fixtureEffect = preset.fixtureEffect;
    if (fixtureEffect !== undefined) {
      invariant(isRecord(fixtureEffect), `${context}: fixtureEffect must be an object.`);
      const modes = fixtureEffectModes[fixtureEffect.kind];
      invariant(
        modes instanceof Set,
        `${context}: fixtureEffect.kind must be layout, content, data, or status.`,
      );
      invariant(
        modes.has(fixtureEffect.mode),
        `${context}: fixtureEffect mode ${String(fixtureEffect.mode)} is invalid for ${String(
          fixtureEffect.kind,
        )}.`,
      );
      invariant(
        typeof fixtureEffect.label === 'string' && fixtureEffect.label.length > 0,
        `${context}: fixtureEffect.label is required.`,
      );
      invariant(
        typeof fixtureEffect.description === 'string' && fixtureEffect.description.length > 0,
        `${context}: fixtureEffect.description is required.`,
      );
      invariant(
        Object.keys(fixtureEffect).every((key) =>
          ['kind', 'mode', 'label', 'description'].includes(key),
        ),
        `${context}: fixtureEffect contains an undeclared field.`,
      );
      fixtureEffectCount += 1;
    }
    invariant(
      preset.id === 'default' ||
        preset.scenario !== 'default' ||
        Object.keys(preset.args).length > 0 ||
        preset.visualPseudoState !== undefined ||
        (isRecord(environment) && Object.keys(environment).length > 0) ||
        fixtureEffect !== undefined,
      `${context}: non-default preset has no executable scenario, args, environment, pseudo-state, or fixture effect.`,
    );
  }
  presetCount += definition.presets.length;

  invariant(Array.isArray(definition.states), `${item.id}: states compatibility view is required.`);
  invariant(
    JSON.stringify(definition.states) === JSON.stringify(definition.presets.map(({ id }) => id)),
    `${item.id}: states must be derived from preset ids in the same order.`,
  );
  const unmappedAcceptanceStates = item.states
    .map((state) => ({ label: state, id: normalizeStateId(state) }))
    .filter(({ id }) => !presetById.has(id));
  invariant(
    unmappedAcceptanceStates.length === 0,
    `${item.id}: catalog acceptance states have no executable preset: ${unmappedAcceptanceStates
      .map(({ label, id }) => `${JSON.stringify(label)} (${id})`)
      .join(', ')}.`,
  );

  for (const [state, [key, value]] of environmentStateExpectations) {
    invariant(
      presetById.has(state),
      `${item.id}: missing required executable environment preset ${state}.`,
    );
    const environment = presetById.get(state).environment;
    invariant(
      isRecord(environment) && environment[key] === value,
      `${item.id}.${state}: preset must execute ${key}=${value} through registry metadata.`,
    );
  }
}

for (const id of definitionsById.keys()) {
  invariant(catalogById.has(id), `${id}: playground definition is not present in KERN_CATALOG.`);
}
invariant(
  bindingIssues.length === 0,
  `Playground control binding provenance is invalid:\n- ${bindingIssues.join('\n- ')}`,
);
invariant(
  apiCoverage.publicInputsAndModels === 1034,
  `Expected 1034 public inputs/models, received ${apiCoverage.publicInputsAndModels}.`,
);
invariant(
  apiCoverage.controlled === 649,
  `Expected 649 directly controlled public inputs/models, received ${apiCoverage.controlled}.`,
);
invariant(
  apiCoverage.excluded === 385,
  `Expected 385 exact API exclusions, received ${apiCoverage.excluded}.`,
);
invariant(apiCoverage.unclassified === 0, 'Public playground API contains unclassified members.');
invariant(
  apiExclusions.length === apiCoverage.excluded,
  'Coverage exclusion count differs from the published exclusion registry.',
);
invariant(
  Object.values(autoControlKeys).flat().length > 0,
  'Expected the public API synchronizer to own at least one automatically rendered control.',
);

console.log(
  `KERN playground registry verified: ${definitions.length}/${catalog.length} components; ${controlCount} controls (${apiCoverage.controlled}/${apiCoverage.publicInputsAndModels} public API, ${apiCoverage.excluded} exact exclusions, 0 unclassified); ${presetCount} executable presets; ${fixtureEffectCount} fixture effects; 0 unmapped acceptance states.`,
);
