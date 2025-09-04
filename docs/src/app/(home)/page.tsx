import { home } from '@/.source';
import React from 'react';

import { mdxComponents } from '../layout.config';
import HeroSection from './page/hero';
import CodeSection from './page/code';
import FeaturesSection from './page/features';
import CtaSection from './page/cta';
import FooterSection from './page/footer';
import { ExampleProvider } from './page/example-context';

function getExamples(): Record<string, React.ReactElement> {
    const examples: Record<string, React.ReactElement> = {};
    home.docs.forEach(doc => {
        const match = doc._file.path.match(/^example-(.*)\.mdx$/);
        if (match) {
            const MDXContent = doc.body;
            examples[match[1]] = <MDXContent components={mdxComponents} />;
        }
    });
    return examples;
}

export default function HomePage() {
    const examples = getExamples();
    return (
        <main className="flex flex-1 flex-col">
            <HeroSection />
            <ExampleProvider>
                <CodeSection examples={examples} />
                <FeaturesSection />
            </ExampleProvider>
            <CtaSection />
            <FooterSection />
        </main>
    );
}
