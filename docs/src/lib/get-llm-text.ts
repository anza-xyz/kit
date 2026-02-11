import { apiSource, docsSource } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';

export async function getLLMText(page: InferPageType<typeof apiSource | typeof docsSource>) {
    const processed = await page.data.getText('processed');

    return `# ${page.data.title} (${page.url})
${processed}`;
}
