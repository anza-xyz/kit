import { ThemedImage } from '@/lib/ThemedImage';
import DarkHeader from '@/public/header/dark-header.jpg';
import LightHeader from '@/public/header/light-header.jpg';
import Link from 'fumadocs-core/link';

export default function HeroSection() {
    return (
        <section className="relative border-b border-mauve-400 dark:border-mauve-700">
            <ThemedImage
                alt="Home illustration for the Kit library. A cute fox jumps towards a UI element with the Solana logo on it. It is surrounded by other UI elements such as buttons, sliders, browser windows and diagrams."
                className="w-full h-full min-h-96 md:min-h-none 2xl:max-h-[calc(100vh-calc(var(--spacing)*50))] object-cover object-[60%_50%] md:object-center"
                placeholder="blur"
                sizes="100vw"
                src={{
                    dark: DarkHeader,
                    light: LightHeader,
                }}
            />
            <div className="absolute bottom-20 md:bottom-30 left-0 md:left-10 lg:left-0 w-full">
                <div className="w-full max-w-home-container mx-auto px-4 py-8">
                    <h1 className="text-linen-900 text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl mb-4 lg:mb-6 xl:mb-8">
                        Your JavaScript
                        <br />
                        SDK for Solana
                    </h1>
                    <Link
                        href="/docs"
                        className="inline-block lg:text-xl 2xl:text-2xl text-white bg-coral-400 hover:bg-coral-500 dark:bg-coral-500 dark:hover:bg-coral-400 px-3 py-1.5 lg:px-6 lg:py-2 rounded-lg"
                    >
                        Get started with Kit
                    </Link>
                </div>
            </div>
        </section>
    );
}
