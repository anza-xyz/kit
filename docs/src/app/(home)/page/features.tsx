'use client';

import { useContext } from 'react';
import { ExampleContext, ExampleKey } from './example-context';
import { ThemedImage } from '@/lib/ThemedImage';
import { Link } from 'fumadocs-core/framework';
import { cn } from 'fumadocs-ui/utils/cn';

type Feature = {
    key: ExampleKey;
    label: string;
    description: string;
    href: string;
};

const features: Feature[] = [
    {
        key: 'rpc',
        label: 'RPC',
        description: 'Configure your Solana RPC and send requests to send transactions or fetch data.',
        href: '/docs/concepts/rpc',
    },
    {
        key: 'codecs',
        label: 'Codecs',
        description: 'Compose codecs together to encode and decode any value to and from a byte array.',
        href: '/docs/concepts/codecs',
    },
    {
        key: 'signers',
        label: 'Signers',
        description: 'Create signer objects to sign transactions and/or messages with your wallets.',
        href: '/docs/concepts/signers',
    },
    {
        key: 'transactions',
        label: 'Transactions',
        description: 'Gradually build transaction messages before compiling and sending them to the network.',
        href: '/docs/concepts/transactions',
    },
    {
        key: 'rpc-subscriptions',
        label: 'RPC Subscriptions',
        description: 'Subscribe to RPC notifications such as account changes, slot updates, and more.',
        href: '/docs/concepts/rpc-subscriptions',
    },
    {
        key: 'solana-programs',
        label: 'Solana Programs',
        description: 'Interact with various Solana programs using their Codama-generated SDKs.',
        href: '/docs/compatible-clients',
    },
];

export default function FeaturesSection() {
    const { example, setExample } = useContext(ExampleContext);
    const set = (key: ExampleKey) => () => setExample(key);

    return (
        <section className="w-full max-w-home-container mx-auto px-4 pt-40 pb-10 md:pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 lg:gap-12">
                {features.map(feature => (
                    <div key={feature.key} className="flex gap-4 md:gap-6 lg:gap-8">
                        <div
                            className="aspect-square w-20 md:w-24 lg:w-40 flex-shrink-0 cursor-pointer"
                            onClick={set(feature.key)}
                        >
                            <ThemedImage
                                width={350}
                                height={350}
                                src={theme => `/features/${theme}-${feature.key}.png`}
                                alt={`${feature.label} feature abstract illustration.`}
                            />
                        </div>
                        <div className="flex-1">
                            <h3
                                className={cn([
                                    'font-title text-2xl cursor-pointer',
                                    example === feature.key
                                        ? 'text-coral-400 dark:text-coral-500'
                                        : 'text-linen-400 dark:text-mauve-400',
                                ])}
                                onClick={set(feature.key)}
                            >
                                {feature.label}
                            </h3>
                            <p className="text-lg text-linen-500 dark:text-mauve-300 mt-2">{feature.description}</p>
                            <div className="mt-1">
                                <Link
                                    href={feature.href}
                                    className="inline-block text-lg text-coral-400 hover:text-coral-500 dark:text-coral-500 dark:hover:text-coral-400 transition-colors"
                                >
                                    Learn more
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Link
                href="/docs/concepts"
                className="block mt-16 font-title text-2xl text-linen-300 dark:text-mauve-500 text-center"
            >
                And many more...
            </Link>
        </section>
    );
}
