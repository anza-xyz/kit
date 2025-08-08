import Link from 'fumadocs-core/link';
import { RootToggle } from 'fumadocs-ui/components/layout/root-toggle';
import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import {
    CollapsibleSidebar,
    SidebarCollapseTrigger,
    SidebarFooter,
    SidebarHeader,
    SidebarPageTree,
    SidebarViewport,
} from 'fumadocs-ui/components/layout/sidebar';
import { ThemeToggle } from 'fumadocs-ui/components/layout/theme-toggle';
import { LanguageToggle } from 'fumadocs-ui/components/layout/language-toggle';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { CollapsibleControl, DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { getSidebarTabsFromOptions, SidebarLinkItem } from 'fumadocs-ui/layouts/docs/shared';
import { BaseLinkItem, IconItemType } from 'fumadocs-ui/layouts/links';
import { getLinks } from 'fumadocs-ui/layouts/shared';
import { cn } from 'fumadocs-ui/utils/cn';
import { Languages, SidebarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { LogoWithSolana } from '../logo';

export function Sidebar({
    nav = {},
    sidebar: {
        tabs: sidebarTabs,
        footer: sidebarFooter,
        banner: sidebarBanner,
        components: sidebarComponents,
        ...sidebarProps
    } = {},
    searchToggle = {},
    themeSwitch = { enabled: true },
    i18n = false,
    ...props
}: DocsLayoutProps) {
    const tabs = useMemo(() => getSidebarTabsFromOptions(sidebarTabs, props.tree) ?? [], [sidebarTabs, props.tree]);
    const links = getLinks(props.links ?? [], props.githubUrl);
    const iconLinks = links.filter((item): item is IconItemType => item.type === 'icon');

    const header = (
        <SidebarHeader className="data-[empty=true]:hidden">
            <div className="relative flex justify-center max-md:hidden">
                <Link href={nav.url ?? '/'} className="inline-flex items-center">
                    <LogoWithSolana className="h-16 my-4" />
                </Link>

                <SidebarCollapseTrigger
                    className={cn(
                        buttonVariants({
                            color: 'ghost',
                            size: 'icon-sm',
                            className: 'absolute top-0 right-0 text-fd-muted-foreground max-md:hidden',
                        }),
                    )}
                >
                    <SidebarIcon />
                </SidebarCollapseTrigger>
            </div>
            {searchToggle.enabled !== false &&
                (searchToggle.components?.lg ?? (
                    <LargeSearchToggle hideIfDisabled className="max-md:hidden rounded-lg" />
                ))}
            {tabs.length > 0 && <RootToggle options={tabs} />}

            {sidebarBanner}
        </SidebarHeader>
    );

    const viewport = (
        <SidebarViewport>
            {links
                .filter(v => v.type !== 'icon')
                .map((item, i, list) => (
                    <SidebarLinkItem key={i} item={item} className={cn(i === list.length - 1 && 'mb-4')} />
                ))}
            <SidebarPageTree components={sidebarComponents} />
        </SidebarViewport>
    );

    const footer = (
        <SidebarFooter>
            <div className="flex text-fd-muted-foreground items-center justify-end empty:hidden">
                {iconLinks.map((item, i) => (
                    <BaseLinkItem
                        key={i}
                        item={item}
                        className={cn(
                            buttonVariants({ size: 'icon-sm', color: 'ghost' }),
                            i === iconLinks.length - 1 && 'me-auto',
                        )}
                        aria-label={item.label}
                    >
                        {item.icon}
                    </BaseLinkItem>
                ))}
                {i18n ? (
                    <LanguageToggle>
                        <Languages className="size-4.5" />
                    </LanguageToggle>
                ) : null}
                {themeSwitch.enabled !== false &&
                    (themeSwitch.component ?? <ThemeToggle className="p-0 ms-1.5" mode={themeSwitch.mode} />)}
            </div>
            {sidebarFooter}
        </SidebarFooter>
    );

    return (
        <>
            <div className="max-md:hidden">
                <CollapsibleControl />
            </div>
            <CollapsibleSidebar {...sidebarProps}>
                {header}
                {viewport}
                {footer}
            </CollapsibleSidebar>
        </>
    );
}
