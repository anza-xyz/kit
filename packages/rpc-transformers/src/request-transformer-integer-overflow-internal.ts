import { KeyPath, TraversalState } from './tree-traversal';

export function getIntegerOverflowNodeVisitor(onIntegerOverflow: (keyPath: KeyPath, value: bigint) => void) {
    return <T>(value: T, { keyPath }: TraversalState): T => {
        if (typeof value === 'bigint') {
            if (onIntegerOverflow && (value > Number.MAX_SAFE_INTEGER || value < -Number.MAX_SAFE_INTEGER)) {
                onIntegerOverflow(keyPath as (number | string)[], value);
            }
        }
        return value;
    };
}
