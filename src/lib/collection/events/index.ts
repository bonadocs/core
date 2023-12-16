import { Event, EventListener, EventType } from './types'

export * from './types'

const wildcard = '*'
export class EventEmitter {
  private listeners = new Map<EventType, EventListener<never, never>[]>([
    [wildcard, []],
  ])

  private eventStack: Event<never, never>[] = []

  on<TEvent extends EventType, TEventData>(
    type: TEvent,
    listener: EventListener<TEvent, TEventData>,
  ) {
    const listeners = this.listeners.get(type) || []
    listeners.push(listener)
    this.listeners.set(type, listeners)
  }

  off<TEvent extends EventType, TEventData>(
    type: TEvent,
    listener: EventListener<TEvent, TEventData>,
  ) {
    const listeners = this.listeners.get(type) || []
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
    this.listeners.set(type, listeners)
  }

  async emit<TEvent extends EventType, TEventData>(
    event: Event<TEvent, TEventData>,
  ) {
    try {
      const wildcardListeners = this.listeners.get(wildcard)!
      const eventListeners = this.listeners.get(event.type) || []
      const listeners = eventListeners.concat(wildcardListeners)
      for (const listener of listeners) {
        await (listener as EventListener<TEvent, TEventData>).process(event)
      }
      this.eventStack.push(event as Event<never, never>)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async undo() {
    try {
      const event = this.eventStack.pop()
      if (event) {
        const wildcardListeners = this.listeners.get(wildcard)!
        const eventListeners = this.listeners.get(event.type) || []
        const listeners = eventListeners.concat(wildcardListeners)
        for (const listener of listeners) {
          await listener.undo(event)
        }
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}
