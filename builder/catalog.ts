import { assertContract, validateModuleCatalog } from '../core/validation.js';
import type { Catalog } from './model.js';

export const BUILDER_VERSION = '0.1.0-draft';
export const BACKEND_ID = 'sqlite-local';
export const EFFECT = 'instance.install';
export function foundationCatalog(): Catalog {
  const modules = [
    assertContract('module', { kind: 'module', schema_version: BUILDER_VERSION, id: 'project-context', version: BUILDER_VERSION,
      purpose: 'Identidad y contexto persistente de un proyecto', dependencies: [],
      requires_capabilities: ['conditional_writes', 'history', 'scoped_queries'], exports: ['project', 'source', 'capture', 'claim', 'decision', 'artifact', 'relation'] }),
    assertContract('module', { kind: 'module', schema_version: BUILDER_VERSION, id: 'installation-verification', version: BUILDER_VERSION,
      purpose: 'Construcción local con evidencia y recuperación', dependencies: [{ id: 'project-context', version: BUILDER_VERSION }],
      requires_capabilities: ['atomic_writes'], exports: ['plan', 'manifest'] }),
  ];
  const blueprint = assertContract('blueprint', { kind: 'blueprint', schema_version: BUILDER_VERSION, id: 'project-knowledge-foundation', version: BUILDER_VERSION,
    purpose: 'Base instalable de conocimiento sobre un proyecto; workflows en M3',
    modules: modules.map(({ id, version }) => ({ id, version })), required_capabilities: ['conditional_writes', 'atomic_writes', 'history', 'scoped_queries'],
    required_configuration: ['owner_id', 'project_id', 'profile'], entity_kinds: ['project', 'source', 'capture', 'claim', 'decision', 'artifact', 'relation'],
    acceptance: ['A01', 'A02', 'A15', 'A16', 'A17', 'A19'] });
  validateModuleCatalog(modules);
  return { blueprint, modules };
}
