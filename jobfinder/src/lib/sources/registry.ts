import { arbeitnowConnector } from './arbeitnow';
import { greenhouseConnector } from './greenhouse';
import type { JobSourceConnector } from './types';

/**
 * The only place the application lists its sources.
 *
 * To add a job site: create a folder under src/lib/sources/, implement
 * JobSourceConnector, add it here, and insert a matching row in the `sources`
 * table. Nothing in search, filtering, storage or the UI changes.
 */
export const CONNECTORS: JobSourceConnector<never>[] = [
  arbeitnowConnector as JobSourceConnector<never>,
  greenhouseConnector as JobSourceConnector<never>,
];

export function getConnector(id: string): JobSourceConnector<never> | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export function connectorIds(): string[] {
  return CONNECTORS.map((c) => c.id);
}
