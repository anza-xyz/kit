[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/rpc-subscriptions-channel-websocket?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/rpc-subscriptions-channel-websocket?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/rpc-subscriptions-channel-websocket

# @solana/rpc-subscriptions-channel-websocket

This package allows developers to create custom RPC Subscriptions channels. Using these primitives, developers can create custom channels that perform transforms on messages sent and received, perform autopings, and implement custom channel pooling strategies.

## Functions

### `createWebSocketChannel()`

Creates an object that represents an open channel to a `WebSocket` server.

You can use it to send messages by calling its `send()` function and you can receive them by subscribing to the `RpcSubscriptionChannelEvents` it emits.

```ts
import { createWebSocketChannel } from '@solana/rpc-subscriptions-channel-websocket';

const abortController = new AbortController();
const webSocketChannel = await createWebSocketChannel({
    sendBufferHighWatermark: Number.POSITIVE_INFINITY,
    signal: abortController.signal,
    url: 'wss://api.mainnet-beta.solana.com',
});
const channel = {
    ...webSocketChannel,
    on(type, listener, options) {
        if (type !== 'message') {
            return webSocketChannel.on(type, listener, options);
        }
        return webSocketChannel.on(
            'message',
            function deserializingListener(message: string) {
                const deserializedMessage = JSON.parse(message);
                listener(deserializedMessage);
            },
            options,
        );
    },
    send(message) {
        const serializedMessage = JSON.stringify(message);
        return webSocketChannel.send(serializedMessage);
    },
} as RpcSubscriptionsChannel<unknown, unknown>;
channel.on(
    'error',
    e => {
        console.log('Received error', e);
        abortController.abort();
    },
    { signal: abortController.signal },
);
channel.on(
    'message',
    m => {
        console.log('Received message', m);
        abortController.abort();
    },
    { signal: abortController.signal },
);
await channel.send({ id: 1, jsonrpc: '2.0', method: 'getSlot' });
```

#### Config

##### `sendBufferHighWatermark`

The number of bytes to admit into the WebSocket's send buffer before queueing messages on the client.

When you call `send()` on a `WebSocket` the runtime might add the message to a buffer rather than send it right away. In the event that `socket.bufferedAmount` exceeds the value configured here, messages will be added to a queue in your application code instead of being sent to the WebSocket, until such time as the `bufferedAmount` falls back below the high watermark.

##### `signal`

An `AbortSignal` to fire when you want to explicitly close the `WebSocket`.

If the channel is open it will be closed with the code `1000`, representing a normal closure. If the channel has not been established yet, firing this signal will result in the `AbortError` being thrown to the caller who was trying to open the channel.

##### `url`

A string representing the target endpoint. In Node, it must be an absolute URL using the `ws` or `wss` protocol.
