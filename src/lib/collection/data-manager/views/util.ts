import { EventListener, EventType } from '../../events'

export type CallbackListener = (() => void) | undefined

/**
 * Creates an event listener that calls the callback when the event is processed or undone.
 * The primary use case for this is to trigger UI updates. UIs should depend on view classes
 * and can get the latest data from the view. The callback is triggered when the underlying
 * data manager is updated.
 *
 * @param callbackGetter This is a function to enable lazy evaluation of the callback.
 *                       This allows the callback to be set after the event listener is created.
 */
export function createEventListener<T extends EventType>(
  callbackGetter: () => CallbackListener,
): EventListener<T> {
  const callback = callbackGetter()
  return {
    process(): void | Promise<void> {
      if (callback) callback()
    },
    undo(): void | Promise<void> {
      if (callback) callback()
    },
  }
}
