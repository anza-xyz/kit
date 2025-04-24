import { docsSource } from '@/lib/source';
import { Spread } from '@/lib/Spread';
import { getPageTreePeers } from 'fumadocs-core/server';
import { Cards, Card } from 'fumadocs-ui/components/card';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = docsSource.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;
    const hasCategory = page.file.name === 'index' && page.slugs.length > 0;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription className="mb-16">{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX
                    components={{
                        ...defaultMdxComponents,
                        img: props => <ImageZoom {...props} />,
                        Popup,
                        PopupContent,
                        PopupTrigger,
                        Spread,
                        Step,
                        Steps,
                        Tab,
                        Tabs,
                    }}
                />
            </DocsBody>
            {hasCategory && (
                <Cards>
                    {getPageTreePeers(docsSource.pageTree, page.url).map(peer => (
                        <Card key={peer.url} title={peer.name} href={peer.url}>
                            {peer.description}
                        </Card>
                    ))}
                </Cards>
            )}
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return docsSource.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = docsSource.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
