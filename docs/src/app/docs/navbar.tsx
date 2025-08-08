import Link from 'fumadocs-core/link';
import { SearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { Navbar as BaseNavbar, NavbarSidebarTrigger } from 'fumadocs-ui/layouts/docs-client';
import { cn } from 'fumadocs-ui/utils/cn';
import { Sidebar as SidebarIcon } from 'lucide-react';
import { Logo } from '../logo';

export function Navbar({
    nav = {},
    sidebar: { enabled: sidebarEnabled = true } = {},
    searchToggle = {},
}: DocsLayoutProps) {
    return (
        <BaseNavbar className="h-16 md:hidden">
            {searchToggle.enabled !== false &&
                (searchToggle.components?.sm ?? <SearchToggle className="p-2" hideIfDisabled />)}
            <Link href={nav.url ?? '/'} className="flex-1 inline-flex items-center gap-2.5 font-semibold">
                <Logo className="h-10 my-2" />
            </Link>
            {sidebarEnabled && (
                <NavbarSidebarTrigger
                    className={cn(
                        buttonVariants({
                            color: 'ghost',
                            size: 'icon-sm',
                            className: 'p-2',
                        }),
                    )}
                >
                    <SidebarIcon />
                </NavbarSidebarTrigger>
            )}
        </BaseNavbar>
    );
}
