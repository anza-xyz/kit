import { apiSource } from '@/lib/source';
import { Spread } from '@/lib/Spread';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = apiSource.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;

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
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return apiSource.generateParams().filter(
        params =>
            // FIXME(#405): Build times on Vercel are so long as to make deploys impossible. For
            // now, let's let Vercel generate API reference pages as they're visited (ISR -
            // Incremental Static Generation).
            params.slug.length === 0, // Except for the index page; generate that statically.
    );
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = apiSource.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
