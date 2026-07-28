import { Box } from '@radix-ui/themes';
import type { ReactNode } from 'react';

type Props = Readonly<{
    busy: boolean;
    children: ReactNode;
}>;

/**
 * Dims its subtree and disables pointer interaction while `busy`.
 *
 * Used to hold wallet-dependent UI on screen during a chain-switch warm-up: the previous account
 * stays visible (via {@link useDisplayedWallet}) but greyed out. The `pointer-events: none` is
 * important — the displayed connection belongs to the previous, disposed client,
 * so it must not be acted on until the new client settles.
 *
 * @param busy - When `true`, dim to 50% and block pointer events; also sets `aria-busy`.
 */
export function Dimmable({ busy, children }: Props) {
    return (
        <Box
            aria-busy={busy}
            style={{
                opacity: busy ? 0.5 : 1,
                pointerEvents: busy ? 'none' : undefined,
                transition: 'opacity 150ms',
            }}
        >
            {children}
        </Box>
    );
}
