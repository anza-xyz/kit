'use client';

import { type InkeepModalSearchAndChatProps } from '@inkeep/cxkit-react';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import dynamic from 'next/dynamic';

const InkeepModalSearchAndChat = dynamic(
    () => import('@inkeep/cxkit-react').then(({ InkeepModalSearchAndChat }) => InkeepModalSearchAndChat),
    { ssr: false },
);
const AI_ASSISTANT_NAME = 'Kit';

export default function InKeepSearchDialog(props: SharedProps) {
    const { open, onOpenChange } = props;
    const config: InkeepModalSearchAndChatProps = {
        baseSettings: {
            apiKey:
                /**
                 * Need to use search in development?
                 *
                 * ```shell
                 * pnpm vercel link -p kit-docs -S anza-tech --yes
                 * pnpm vercel env pull --environment=development
                 * ```
                 */
                process.env.NEXT_PUBLIC_INKEEP_SEARCH_API_KEY,
            colorMode: {
                sync: {
                    target: globalThis.document?.documentElement,
                    attributes: ['class'],
                    isDarkMode: attributes => !!attributes.class?.includes('dark'),
                },
            },
            ...(process.env.NODE_ENV === 'development' ? { env: 'development' } : null),
            organizationDisplayName: 'Kit',
            primaryBrandColor: (() => {
                if (typeof globalThis.getComputedStyle === 'undefined') {
                    return '#ff0000'; // Should never appear.
                }
                const rootStyles = getComputedStyle(document.documentElement);
                return rootStyles.getPropertyValue('--color-coral-400').trim();
            })(),
            privacyPreferences: {
                optOutAnalyticalCookies: true,
                optOutAllAnalytics: true,
            },
            transformSource(source) {
                const detectedTabs: string[] = [];
                if (source.url.startsWith('https://solana.stackexchange.com/')) {
                    detectedTabs.push('Q & A');
                } else if (source.url.startsWith('https://github.com/')) {
                    detectedTabs.push('GitHub');
                } else if (source.contentType === 'documentation') {
                    detectedTabs.push(source.breadcrumbs[0] === 'API' ? 'API' : 'Docs');
                }
                return {
                    ...source,
                    tabs: [...(source.tabs ?? []), ...detectedTabs],
                    url:
                        // Strip absolute URLs from the search results because InKeep will not
                        // consider doc site articles as being first-party from the perspective of
                        // the main domain in all environments (eg. development, staging).
                        [/^https:\/\/[\w-]+\.vercel\.app\//, /^https:\/\/solanakit.com\//].reduce(
                            (url, regex) => url.replace(regex, '/'),
                            source.url,
                        ),
                };
            },
        },
        modalSettings: {
            isOpen: open,
            onOpenChange,
        },
        searchSettings: {
            debounceTimeMs: 250,
            tabs: ['All', ['API', { isAlwaysVisible: true }], ['Docs', { isAlwaysVisible: true }], 'Q & A', 'GitHub'],
        },
        aiChatSettings: {
            aiAssistantAvatar: {
                dark: '/mascots/dark-mascot-3-4.svg',
                light: '/mascots/light-mascot-3-4.svg',
            },
            aiAssistantName: AI_ASSISTANT_NAME,
            conversationVisibility: 'private',
            disclaimerSettings: {
                isEnabled: true,
                label: 'Disclaimer',
                tooltip: 'These AI-generated responses may be inaccurate or incomplete.',
            },
            exampleQuestions: [
                'I have a 64-byte secret key. Can I use it to sign messages and transactions with Kit?',
                'Show me how to subscribe for updates to the data of an account',
                'How can I fetch all transaction in a given block?',
            ],
            introMessage: `Hi!\n\nI'm an AI assistant trained on the docs and API reference on this site.\n\nAsk me anything about \`${AI_ASSISTANT_NAME}\`.`,
            placeholder: 'Ask me a question',
        },
    };

    return <InkeepModalSearchAndChat {...config} />;
}
