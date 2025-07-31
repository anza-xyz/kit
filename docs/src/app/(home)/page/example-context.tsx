'use client';

import { createContext, useEffect, useMemo, useRef, useState } from 'react';

const EXAMPLES = ['rpc', 'codecs', 'signers', 'transactions', 'rpc-subscriptions', 'solana-programs'] as const;
const TIMER_INTERVAL = 8000; // 8 seconds

export type ExampleKey = (typeof EXAMPLES)[number];

export const ExampleContext = createContext<{
    example: ExampleKey;
    setExample: (example: ExampleKey) => void;
    progress: number;
    resume: () => void;
    paused: boolean;
}>({
    example: EXAMPLES[0],
    setExample: () => {},
    progress: 0,
    resume: () => {},
    paused: false,
});

export function ExampleProvider({
    children,
    defaultExample,
}: {
    children: React.ReactNode;
    defaultExample?: ExampleKey;
}) {
    const [example, setExample] = useState<ExampleKey>(defaultExample ?? EXAMPLES[0]);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);

    const exampleIndex = useMemo(() => EXAMPLES.findIndex(e => e === example), [example]);
    const startTimeRef = useRef(performance.now());
    const rafRef = useRef<number | null>(null);

    const tick = () => {
        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        const newProgress = Math.min(elapsed / TIMER_INTERVAL, 1);
        setProgress(newProgress);

        if (newProgress >= 1) {
            const nextIndex = (exampleIndex + 1) % EXAMPLES.length;
            setExample(EXAMPLES[nextIndex]);
            startTimeRef.current = now;
            setProgress(0);
        }

        rafRef.current = requestAnimationFrame(tick);
    };

    const stopTick = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    useEffect(() => {
        stopTick();
        if (!paused) {
            rafRef.current = requestAnimationFrame(tick);
        }
        return stopTick;
    }, [exampleIndex, paused]);

    const setExampleAndPause = (newExample: ExampleKey) => {
        setExample(newExample);
        setProgress(0);
        setPaused(true);
        startTimeRef.current = performance.now();
    };

    const resume = () => {
        startTimeRef.current = performance.now();
        setPaused(false);
    };

    return (
        <ExampleContext value={{ example, setExample: setExampleAndPause, progress, resume, paused }}>
            {children}
        </ExampleContext>
    );
}
