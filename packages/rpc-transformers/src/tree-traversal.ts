import { RpcRequest, RpcRequestTransformer, RpcResponseTransformer } from '@solana/rpc-spec-types';

export type KeyPathWildcard = { readonly __brand: unique symbol };
export type KeyPath = ReadonlyArray<KeyPath | KeyPathWildcard | number | string>;

export const KEYPATH_WILDCARD = {} as KeyPathWildcard;

type NodeVisitor = <TState extends TraversalState>(value: unknown, state: TState) => unknown;
export type TraversalState = Readonly<{
    keyPath: KeyPath;
}>;

function getTreeWalker(visitors: NodeVisitor[]) {
    return function traverse<TState extends TraversalState>(node: unknown, state: TState): unknown {
        if (Array.isArray(node)) {
            return node.map((element, ii) => {
                const nextState = {
                    ...state,
                    keyPath: [...state.keyPath, ii],
                };
                return traverse(element, nextState);
            });
        } else if (typeof node === 'object' && node !== null) {
            const out: Record<number | string | symbol, unknown> = {};
            for (const propName in node) {
                if (!Object.prototype.hasOwnProperty.call(node, propName)) {
                    continue;
                }
                const nextState = {
                    ...state,
                    keyPath: [...state.keyPath, propName],
                };
                out[propName] = traverse(node[propName as keyof typeof node], nextState);
            }
            return out;
        } else {
            return visitors.reduce((acc, visitNode) => visitNode(acc, state), node);
        }
    };
}

/**
 * Creates a transformer that traverses the request parameters and executes the provided visitors at
 * each node. A custom initial state can be provided but must at least provide `{ keyPath: [] }`.
 *
 * @example
 * ```ts
 * import { getTreeWalkerRequestTransformer } from '@solana/rpc-transformers';
 *
 * const requestTransformer = getTreeWalkerRequestTransformer(
 *     [
 *         // Replaces foo.bar with "baz".
 *         (node, state) => (state.keyPath === ['foo', 'bar'] ? 'baz' : node),
 *         // Increments all numbers by 1.
 *         node => (typeof node === number ? node + 1 : node),
 *     ],
 *     { keyPath: [] },
 * );
 * ```
 */
export function getTreeWalkerRequestTransformer<TState extends TraversalState>(
    visitors: NodeVisitor[],
    initialState: TState,
): RpcRequestTransformer {
    return <TParams>(request: RpcRequest<TParams>): RpcRequest => {
        const traverse = getTreeWalker(visitors);
        return Object.freeze({
            ...request,
            params: traverse(request.params, initialState),
        });
    };
}

export function getTreeWalkerResponseTransformer<TState extends TraversalState>(
    visitors: NodeVisitor[],
    initialState: TState,
): RpcResponseTransformer {
    return json => getTreeWalker(visitors)(json, initialState);
}
