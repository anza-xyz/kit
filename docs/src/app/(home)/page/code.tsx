'use client';

import React, { useContext } from 'react';
import { ExampleContext } from './example-context';
import { Play } from 'lucide-react';

type Props = Readonly<{
    examples: Record<string, React.ReactElement>;
}>;

export default function CodeSection({ examples }: Props) {
    const { example, progress, paused, resume } = useContext(ExampleContext);

    return (
        <section className="relative">
            <div className="absolute w-full max-w-home-container top-0 left-1/2 -translate-1/2 px-4">
                <div
                    id="hero-code"
                    className="relative w-full dark:bg-fd-background/80 backdrop-blur-xl rounded-lg *:m-0 overflow-hidden"
                >
                    <div
                        className="absolute z-10 h-1 bottom-0 bg-mauve-400 dark:bg-mauve-500"
                        style={{ width: `${progress * 100}%` }}
                    ></div>
                    {paused && (
                        <button
                            className="absolute z-10 bottom-2 right-2 p-1.5 cursor-pointer text-mauve-100 bg-mauve-400 hover:bg-mauve-500 dark:bg-mauve-500 dark:hover:bg-mauve-400 rounded-full"
                            onClick={resume}
                        >
                            <Play size={14} fill="currentColor" strokeWidth={0} />
                        </button>
                    )}
                    {examples[example]}
                </div>
            </div>
        </section>
    );
}
