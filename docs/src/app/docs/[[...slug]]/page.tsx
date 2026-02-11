import { mdxComponents } from '@/app/layout.config';
import { LLMCopyButton, ViewOptions } from '@/components/page-actions';
import { overridenMdxComponents } from '@/lib/Overrides';
import { docsSource } from '@/lib/source';
import { getPageTreePeers } from 'fumadocs-core/server';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page = docsSource.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;
    const hasCategory = page.file.name === 'index' && page.slugs.length > 0;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>

            <DocsDescription className='mb-0'>{page.data.description}</DocsDescription>
            <div className="flex flex-row gap-2 items-center mb-8">
                <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
                <ViewOptions
                    markdownUrl={`${page.url}.mdx`}
                    githubUrl={`https://github.com/anza-xyz/kit/blob/main/docs/content${page.url}.mdx`}
                />
            </div>

            <DocsBody>
                <MDX components={mdxComponents} />
            </DocsBody>
            {hasCategory && (
                <overridenMdxComponents.Cards>
                    {getPageTreePeers(docsSource.pageTree, page.url).map(peer => (
                        <overridenMdxComponents.Card key={peer.url} title={peer.name} href={peer.url}>
                            {peer.description}
                        </overridenMdxComponents.Card>
                    ))}
                </overridenMdxComponents.Cards>
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
