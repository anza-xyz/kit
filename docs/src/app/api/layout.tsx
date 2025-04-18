import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { apiSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            // tree={{
            //     ...apiSource.pageTree,
            //     children: apiSource.pageTree.children.filter(node => node.type !== 'page' || node.url !== '/api'),
            // }}
            tree={apiSource.pageTree}
            {...baseOptions}
        >
            {children}
        </DocsLayout>
    );
}
