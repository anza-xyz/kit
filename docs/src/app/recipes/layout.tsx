import { baseOptions } from '@/app/layout.config';
import { recipesSource } from '@/lib/source';
import { DocsLayout, DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { Sidebar } from '../docs/sidebar';
import { Navbar } from '../docs/navbar';

export default function Layout({ children }: { children: ReactNode }) {
    const baseProps: DocsLayoutProps = {
        ...baseOptions,
        tree: recipesSource.pageTree,
    };

    const recipesProps: DocsLayoutProps = {
        ...baseProps,
        sidebar: { ...baseProps.sidebar, component: Sidebar(baseProps) },
        nav: { ...baseProps.nav, component: Navbar(baseProps) },
    };

    return <DocsLayout {...recipesProps}>{children}</DocsLayout>;
}
