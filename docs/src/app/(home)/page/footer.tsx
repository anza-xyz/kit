import { ThemedImage } from '@/lib/ThemedImage';
import { Link } from 'fumadocs-core/framework';

export default function FooterSection() {
    const linkClassName = 'text-linen-600 hover:text-linen-800 dark:text-mauve-300 dark:hover:text-mauve-100';
    return (
        <section className="relative -mt-8 lg:-mt-14 2xl:-mt-28">
            <div className="absolute bottom-0 w-full">
                <div className="w-full max-w-home-container mx-auto flex justify-end *:m-4 sm:*:m-6 md:*:m-8 text-sm md:text-base font-semibold">
                    <Link className={linkClassName} href="/docs">
                        Documentation
                    </Link>
                    <Link className={linkClassName} href="/api">
                        API Reference
                    </Link>
                    <Link className={linkClassName} href="https://www.anza.xyz/">
                        Maintained by Anza
                    </Link>
                </div>
            </div>
            <ThemedImage
                width={2560}
                height={1440}
                src={theme => `/footer/${theme}-footer.svg`}
                className="w-full h-full max-h-200 object-cover object-top"
                alt="Dune illustrations."
            />
        </section>
    );
}
