import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookTextIcon, LibraryBigIcon } from 'lucide-react';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
    nav: {
        title: (
            <>
                <svg
                    className="w-6 h-6"
                    width="353"
                    height="353"
                    viewBox="0 0 353 353"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M207.264 57.2222C209.416 59.3766 210.624 62.2976 210.624 65.3432L210.624 346.351C210.624 351.47 204.437 354.032 200.82 350.411L145.361 294.884C143.209 292.73 142 289.809 142 286.763L142 5.75622C142 0.637137 148.188 -1.92546 151.805 1.69571L207.264 57.2222Z"
                        fill="currentColor"
                    />
                    <path
                        d="M237.891 281.663C234.846 281.661 231.926 280.45 229.772 278.297L31.0701 79.5947C27.4503 75.9749 30.0139 69.7879 35.1318 69.791L113.61 69.8384C116.656 69.8406 119.576 71.0512 121.729 73.2047L320.431 271.907C324.051 275.526 321.488 281.714 316.37 281.711L237.891 281.663Z"
                        fill="currentColor"
                    />
                    <path
                        d="M294.884 145.297C292.73 143.145 289.809 141.937 286.763 141.937H5.75621C0.637139 141.937 -1.92546 148.123 1.69572 151.74L57.2222 207.199C59.3766 209.352 62.2976 210.561 65.3432 210.561H346.351C351.47 210.561 354.032 204.373 350.411 200.756L294.884 145.297Z"
                        fill="currentColor"
                    />
                </svg>
                Solana Kit
            </>
        ),
    },
    links: [
        {
            text: 'Documentation',
            url: '/docs',
            active: 'nested-url',
            icon: <BookTextIcon />,
        },
        {
            text: 'References',
            url: 'https://tsdocs.dev/docs/@solana/kit',
            icon: <LibraryBigIcon />,
        },
    ],
};
