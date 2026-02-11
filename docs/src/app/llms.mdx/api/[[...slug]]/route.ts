import { getLLMText } from '@/lib/get-llm-text';
import { apiSource } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/api/[[...slug]]'>) {
    const { slug } = await params;
    const page = apiSource.getPage(slug);
    if (!page) notFound();

    return new Response(await getLLMText(page), {
        headers: {
            'Content-Type': 'text/markdown',
        },
    });
}

export function generateStaticParams() {
    return apiSource.generateParams();
}
