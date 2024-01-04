export type CollectionEventType =
  | 'collection:rename'
  | 'collection:update-description'
  | 'collection:update-string'
  | 'collection:delete-string'
  | 'collection:add-link'
  | 'collection:remove-link'
  | 'collection:add-contract-interface'
  | 'collection:remove-contract-interface'
  | 'collection:rename-contract-interface'
  | 'collection:add-contract'
  | 'collection:remove-contract'
  | 'collection:rename-contract'
  | 'collection:add-contract-instance'
  | 'collection:remove-contract-instance'
  | 'collection:add-variable'
  | 'collection:rename-variable'
  | 'collection:remove-variable'
  | 'collection:add-workflow'
  | 'collection:rename-workflow'
  | 'collection:remove-workflow'
  | 'collection:add-workflow-variable'
  | 'collection:rename-workflow-variable'
  | 'collection:remove-workflow-variable'
  | 'collection:add-workflow-function'
  | 'collection:remove-workflow-function'
  | 'collection:set-workflow-code'
  | 'collection:delete-workflow-code'

export type FunctionViewEventType = 'add-array-item' | 'remove-array-item'

export type GenericEventType = 'undo-event'

export type EventType =
  | GenericEventType
  | CollectionEventType
  | FunctionViewEventType
  | string

export interface Event<TEvent extends EventType, TData = unknown> {
  type: TEvent
  data: TData
}

export type UndoEvent<TEvent extends EventType, TData = unknown> = Event<
  'undo-event',
  Event<TEvent, TData>
>

export interface EventListener<TEvent extends EventType, TEventData = unknown> {
  process(event: Event<TEvent, TEventData>): void | Promise<void>
  undo(event: Event<TEvent, TEventData>): void | Promise<void>
}
