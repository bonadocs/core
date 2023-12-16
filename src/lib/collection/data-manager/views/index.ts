/**
 * View Classes are designed with the following rules in mind:
 *
 * 0. Views should provide a simple interface for collection data access.
 * 1. Views of the same type over the same data manager must be eventually consistent.
 * 2. Views should expose the data in a manner optimized for efficient access.
 * 3. Views must propagate changes using the event manager.
 * 4. Views must update their internal data structures in response to received events.
 *
 * The rules are created to simplify the process of synchronizing views across devices using
 * the data manager as the source of truth. By propagating the events to other devices,
 * views running on those devices can be updated seamlessly.
 */

export * from './CollectionEnvironmentManagerView'
export * from './CollectionMetadataView'
export * from './ContractDetailsView'
export * from './ContractManagerView'
export * from './FunctionFragmentView'
export * from './ValueManagerView'
