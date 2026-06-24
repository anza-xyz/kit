'use client';

import { AnchorProvider } from 'fumadocs-core/toc';
import { Toc, TOCItems, TOCScrollArea } from 'fumadocs-ui/components/layout/toc';
import { Text } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TableOfContents } from 'fumadocs-core/server';

function idFromUrl(url: string): string {
    return url.startsWith('#') ? url.slice(1) : url;
}

/**
 * Filters a table of contents down to the headings currently present in the
 * document.
 *
 * Tabbed content (such as `CardTabs`) unmounts its inactive panels, so only the
 * active panel's headings exist in the DOM at any given time. A `MutationObserver`
 * on the article element recomputes the visible set whenever panels mount or
 * unmount (i.e. on every tab switch). On pages without tabbed content every
 * heading is always present, so this is a no-op.
 *
 * The previous array reference is preserved when the visible set is unchanged so
 * that consumers keying effects on the result (e.g. the scroll-spy observer in
 * {@link AnchorProvider}) don't needlessly re-run.
 *
 * @param toc - The full, statically generated table of contents.
 * @return The subset of `toc` whose target headings are rendered in the document.
 */
function useVisibleToc(toc: TableOfContents): TableOfContents {
    // Start with the full TOC so the server render and first client render match,
    // then trim to the visible headings once mounted.
    const [visible, setVisible] = useState(toc);

    useEffect(() => {
        const article = document.querySelector('article') ?? document.body;

        function recompute() {
            setVisible(prev => {
                const next = toc.filter(item => article.querySelector(`#${CSS.escape(idFromUrl(item.url))}`) != null);
                const unchanged = next.length === prev.length && next.every((item, i) => item.url === prev[i]?.url);
                return unchanged ? prev : next;
            });
        }

        recompute();
        const observer = new MutationObserver(recompute);
        observer.observe(article, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [toc]);

    return visible;
}

/**
 * Hides table-of-contents entries in the mobile TOC popover (`#nd-tocnav`) whose
 * target headings are not currently in the DOM.
 *
 * The desktop TOC is filtered in React (see {@link VisibleToc}), but the mobile
 * popover is rendered by Fumadocs' `DocsPage` using internal, non-exported
 * primitives that can't be replaced. Its anchor list mounts lazily when opened,
 * so a `MutationObserver` on the nav re-applies the filter as the list appears.
 *
 * @param visible - The headings that should remain visible.
 */
function useHideMobilePopoverDuplicates(visible: TableOfContents): void {
    useEffect(() => {
        const nav = document.getElementById('nd-tocnav');
        if (!nav) return;
        const visibleIds = new Set(visible.map(item => idFromUrl(item.url)));

        function apply() {
            for (const anchor of nav!.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
                const id = anchor.getAttribute('href')?.slice(1) ?? '';
                anchor.style.display = visibleIds.has(id) ? '' : 'none';
            }
        }

        apply();
        // Only watch childList so our own style mutations don't retrigger the observer.
        const observer = new MutationObserver(apply);
        observer.observe(nav, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [visible]);
}

/**
 * A drop-in replacement for Fumadocs' default desktop table of contents that
 * only lists headings visible in the current view.
 *
 * Pass it to {@link DocsPage} via `tableOfContent={{ component: <VisibleToc toc={...} /> }}`.
 * It mirrors the default TOC chrome (heading, scroll area, active-anchor
 * indicator) but renders {@link useVisibleToc the filtered heading set}. It also
 * wraps its own {@link AnchorProvider} seeded with the visible headings so that
 * scroll-spy highlighting re-attaches to the active tab's headings after a tab
 * switch (Fumadocs' page-level provider observes headings only once at mount),
 * and {@link useHideMobilePopoverDuplicates trims the mobile popover} to match.
 *
 * @param props.toc - The full, statically generated table of contents.
 * @return The rendered table of contents containing only visible headings.
 */
export function VisibleToc({ toc }: { toc: TableOfContents }) {
    const items = useVisibleToc(toc);
    useHideMobilePopoverDuplicates(items);
    return (
        <AnchorProvider toc={items}>
            <Toc>
                <h3 className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground">
                    <Text className="size-4" />
                    On this page
                </h3>
                <TOCScrollArea>
                    <TOCItems items={items} />
                </TOCScrollArea>
            </Toc>
        </AnchorProvider>
    );
}
