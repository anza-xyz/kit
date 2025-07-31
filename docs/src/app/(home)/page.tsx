import HeroSection from './page/hero';
import CodeSection from './page/code';
import FeaturesSection from './page/features';
import CtaSection from './page/cta';
import FooterSection from './page/footer';
import { ExampleProvider } from './page/example-context';

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col">
            <HeroSection />
            <ExampleProvider>
                <CodeSection />
                <FeaturesSection />
            </ExampleProvider>
            <CtaSection />
            <FooterSection />
        </main>
    );
}
