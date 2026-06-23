'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/ui/tabs';
import { Children, cloneElement, isValidElement, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from 'fumadocs-ui/utils/cn';
import { FlaskConicalIcon, GlobeIcon, LaptopIcon, PuzzleIcon, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    globe: GlobeIcon,
    laptop: LaptopIcon,
    'flask-conical': FlaskConicalIcon,
    puzzle: PuzzleIcon,
};

interface CardDefinition {
    title: string;
    description: string;
    icon?: string;
}

interface CardTabsProps {
    cards: CardDefinition[];
    groupId?: string;
    persist?: boolean;
    children: ReactNode;
}

function toValue(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Renders a tab list as a grid of selectable cards.
 *
 * @param props - Card tab configuration and tab panel children.
 * @return A card-styled tab group.
 */
export function CardTabs({ cards, groupId, persist = false, children }: CardTabsProps) {
    const values = useMemo(() => cards.map(c => toValue(c.title)), [cards]);
    const [value, setValue] = useState(values[0]);

    useLayoutEffect(() => {
        if (!groupId) return;
        const stored = persist ? localStorage.getItem(groupId) : sessionStorage.getItem(groupId);
        if (stored && values.includes(stored)) {
            setValue(stored);
        }
    }, [groupId, persist, values]);

    function handleChange(v: string) {
        setValue(v);
        if (groupId) {
            if (persist) localStorage.setItem(groupId, v);
            else sessionStorage.setItem(groupId, v);
        }
    }

    // Assign each CardTab child its value by position.
    let tabIndex = 0;
    const panels = Children.map(children, child => {
        if (!isValidElement<CardTabProps>(child)) return child;
        const index = tabIndex++;
        return cloneElement(child, { index, value: values[index] });
    });

    return (
        <Tabs
            value={value}
            onValueChange={handleChange}
            className="my-6 border-none bg-transparent overflow-visible rounded-none"
        >
            <TabsList className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-2 bg-transparent px-0 h-auto items-stretch">
                {cards.map((card, i) => {
                    const Icon = card.icon ? iconMap[card.icon] : undefined;
                    return (
                        <TabsTrigger
                            key={values[i]}
                            value={values[i]}
                            className={cn(
                                'group cursor-pointer rounded-lg border p-4 text-left transition-colors whitespace-normal h-auto',
                                'border-fd-border bg-fd-card hover:border-fd-primary/50',
                                'data-[state=active]:border-fd-primary data-[state=active]:bg-fd-primary/5',
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {Icon && (
                                    <Icon className="size-5 shrink-0 mt-0.5 text-fd-muted-foreground group-data-[state=active]:text-fd-primary" />
                                )}
                                <div>
                                    <div className="text-sm font-semibold text-fd-foreground group-data-[state=active]:text-fd-primary">
                                        {card.title}
                                    </div>
                                    <div className="mt-1 text-xs text-fd-muted-foreground">{card.description}</div>
                                </div>
                            </div>
                        </TabsTrigger>
                    );
                })}
            </TabsList>
            {panels}
        </Tabs>
    );
}

interface CardTabProps {
    children: ReactNode;
    // Injected by the parent `CardTabs` based on this child's position.
    index?: number;
    value?: string;
}

/**
 * Renders one panel within a {@link CardTabs} group.
 *
 * @param props - The tab panel children to render. `index` and `value` are
 *   injected by the parent {@link CardTabs} and should not be passed manually.
 * @return A tab panel associated with the matching card in the parent group.
 * @throws Throws if there are more `CardTab` children than card definitions.
 */
export function CardTab({ children, index, value }: CardTabProps) {
    if (!value) {
        throw new Error(
            `CardTab at index ${index} does not have a matching card definition. ` +
            `Make sure the number of CardTab children matches the number of cards.`,
        );
    }

    return (
        <TabsContent value={value} className="prose-no-margin">
            {children}
        </TabsContent>
    );
}
