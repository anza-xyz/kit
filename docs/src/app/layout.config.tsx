import { overridenMdxComponents } from '@/lib/Overrides';
import { Spread } from '@/lib/Spread';
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { BookTextIcon, LibraryBigIcon } from 'lucide-react';
import { Logo, LogoWithSolana } from './logo';
import { MDXComponents } from 'mdx/types';

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
            <div className="flex">
                <LogoWithSolana className="h-12 max-md:hidden" />
                <Logo className="h-10 md:hidden" />
            </div>
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
            text: 'API Reference',
            url: '/api',
            active: 'nested-url',
            icon: <LibraryBigIcon />,
        },
    ],
};

export const mdxComponents: MDXComponents = {
    ...defaultMdxComponents,
    ...overridenMdxComponents,
    img: props => <ImageZoom {...props} />,
    Popup,
    PopupContent,
    PopupTrigger,
    Spread,
    Step,
    Steps,
};
