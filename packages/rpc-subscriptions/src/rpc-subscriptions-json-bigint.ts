import { pipe } from '@solana/functional';
import { parseJsonWithBigInts, stringifyJsonWithBigints } from '@solana/rpc-spec-types';
import {
    RpcSubscriptionsChannel,
    transformChannelInboundMessages,
    transformChannelOutboundMessages,
} from '@solana/rpc-subscriptions-spec';

/**
 * Similarly, to {@link getRpcSubscriptionsChannelWithJSONSerialization}, this function will
 * stringify and parse JSON message to and from the given `string` channel. However, this function
 * parses any integer value as a `BigInt` in order to safely handle numbers that exceed the
 * JavaScript [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
 * value.
 */
export function getRpcSubscriptionsChannelWithBigIntJSONSerialization(
    channel: RpcSubscriptionsChannel<string, string>,
): RpcSubscriptionsChannel<unknown, unknown> {
    return pipe(
        channel,
        c => transformChannelInboundMessages(c, parseJsonWithBigInts),
        c => transformChannelOutboundMessages(c, stringifyJsonWithBigints),
    );
}
