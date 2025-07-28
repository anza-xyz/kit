import { Card as BaseCard, Cards as BaseCards } from 'fumadocs-ui/components/card';
import { Tab as BaseTab, Tabs as BaseTabs } from 'fumadocs-ui/components/tabs';
import { Callout as BaseCallout } from 'fumadocs-ui/components/callout';

export const Callout = (props => <BaseCallout {...props} className="fd-callout shadow-none" />) as typeof BaseCallout;

export const Card: typeof BaseCard = props => <BaseCard {...props} className="fd-card shadow-none" />;
export const Cards: typeof BaseCards = BaseCards;

export const Tab: typeof BaseTab = BaseTab;
export const Tabs: typeof BaseTabs = props => <BaseTabs {...props} className="fd-tabs rounded-lg" />;

export const overridenMdxComponents = { Callout, Card, Cards, Tab, Tabs };
