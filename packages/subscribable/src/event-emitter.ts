type EventMap = Record<string, Event>;
type Listener<TEvent extends Event> = ((evt: TEvent) => void) | { handleEvent(object: TEvent): void };

/**
 * This type allows you to type `addEventListener` and `removeEventListener` so that the call
 * signature of the listener matches the event type given.
 *
 * @example
 * ```ts
 * const emitter: TypedEventEmitter<{ message: MessageEvent }> = new WebSocket('wss://api.devnet.solana.com');
 * emitter.addEventListener('data', handleData); // ERROR. `data` is not a known event type.
 * emitter.addEventListener('message', message => {
 *     console.log(message.origin); // OK. `message` is a `MessageEvent` so it has an `origin` property.
 * });
 * ```
 */
export interface TypedEventEmitter<TEventMap extends EventMap> {
    addEventListener<const TEventType extends keyof TEventMap>(
        type: TEventType,
        listener: Listener<TEventMap[TEventType]>,
        options?: AddEventListenerOptions | boolean,
    ): void;
    removeEventListener<const TEventType extends keyof TEventMap>(
        type: TEventType,
        listener: Listener<TEventMap[TEventType]>,
        options?: EventListenerOptions | boolean,
    ): void;
}

// Why not just extend the interface above, rather than to copy/paste it?
// See https://github.com/microsoft/TypeScript/issues/60008
/**
 * This type is a superset of `TypedEventEmitter` that allows you to constrain calls to
 * `dispatchEvent`.
 *
 * @example
 * ```ts
 * const target: TypedEventTarget<{ candyVended: CustomEvent<{ flavour: string }> }> = new EventTarget();
 * target.dispatchEvent(new CustomEvent('candyVended', { detail: { flavour: 'raspberry' } })); // OK.
 * target.dispatchEvent(new CustomEvent('candyVended', { detail: { flavor: 'raspberry' } })); // ERROR. Misspelling in detail.
 * ```
 */
export interface TypedEventTarget<TEventMap extends EventMap> {
    addEventListener<const TEventType extends keyof TEventMap>(
        type: TEventType,
        listener: Listener<TEventMap[TEventType]>,
        options?: AddEventListenerOptions | boolean,
    ): void;
    dispatchEvent<TEventType extends keyof TEventMap>(ev: TEventMap[TEventType]): void;
    removeEventListener<const TEventType extends keyof TEventMap>(
        type: TEventType,
        listener: Listener<TEventMap[TEventType]>,
        options?: EventListenerOptions | boolean,
    ): void;
}
