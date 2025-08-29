import { cn } from 'fumadocs-ui/utils/cn';
import Image, { ImageProps, StaticImageData } from 'next/image';

export function ThemedImage({
    alt,
    className,
    src,
    ...props
}: Omit<ImageProps, 'src' | 'priority' | 'loading'> & {
    src: Readonly<{
        dark: StaticImageData;
        light: StaticImageData;
    }>;
}) {
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        blurWidth: _1,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        blurHeight: _2,
        ...darkSrc
    } = src.dark;
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        blurWidth: _3,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        blurHeight: _4,
        ...lightSrc
    } = src.light;
    return (
        <>
            <Image {...lightSrc} {...props} alt={alt} className={cn(className, 'dark:hidden')} />
            <Image {...darkSrc} {...props} alt={alt} className={cn(className, 'not-dark:hidden')} />
        </>
    );
}
