import { ThemedImage } from '@/lib/ThemedImage';
import { Link } from 'fumadocs-core/framework';

export default function CtaSection() {
    return (
        <section className="bg-linear-to-b from-linen-200 to-linen-100 dark:from-mauve-800/25 dark:to-mauve-900/25">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-8 w-full max-w-home-container mx-auto px-4 pt-20 pb-12 md:pb-0">
                <div className="flex-1 flex items-center justify-center">
                    <ThemedImage
                        width={200}
                        height={200}
                        src={theme => `/mascots/${theme}-mascot-inquisitive.svg`}
                        alt="Fox standing inquisitively looking back."
                    />
                </div>
                <div className="flex-1 max-w-lg">
                    <h3 className="font-title text-2xl text-coral-400 dark:text-coral-500">Would you like a tour?</h3>
                    <p className="text-lg text-linen-500 dark:text-mauve-300 mt-2 mb-4">
                        If you&apos;d like to learn more about Kit but don&apos;t know where to start, worry not! A
                        guided tour is available to help you get acquainted with the library and its main features.
                        Through this tour, you&apos;ll end up setting your environment, creating a token account and
                        fetching its data.
                    </p>
                    <Link
                        href="/docs/getting-started/setup"
                        className="inline-block lg:text-xl 2xl:text-2xl text-white bg-mauve-400 hover:bg-mauve-500 dark:bg-mauve-500 dark:hover:bg-mauve-400 px-3 py-1.5 lg:px-6 lg:py-2 rounded-lg"
                    >
                        Get started
                    </Link>
                </div>
            </div>
        </section>
    );
}
