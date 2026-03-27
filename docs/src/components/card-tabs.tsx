'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/ui/tabs';
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
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

const CardTabContext = createContext<{ values: string[]; register: () => number }>({
    values: [],
    register: () => 0,
});

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

    // Collection pattern: each CardTab calls register() during render
    // to get its index. The counter resets on each render cycle.
    const collectionRef = useMemo(() => ({ current: 0 }), []);
    collectionRef.current = 0;

    const ctx = useMemo(
        () => ({
            values,
            register: () => collectionRef.current++,
        }),
        [values, collectionRef],
    );

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
            <CardTabContext.Provider value={ctx}>{children}</CardTabContext.Provider>
        </Tabs>
    );
}

export function CardTab({ children }: { children: ReactNode }) {
    const ctx = useContext(CardTabContext);
    const index = ctx.register();
    const value = ctx.values[index];

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
