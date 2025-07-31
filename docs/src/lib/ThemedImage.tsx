import { Image, ImageProps } from 'fumadocs-core/framework';
import { cn } from 'fumadocs-ui/utils/cn';

export function ThemedImage({
    alt,
    className,
    src,
    ...props
}: Omit<ImageProps, 'src'> & { src: (theme: 'light' | 'dark') => string; alt: string }) {
    return (
        <>
            <Image {...props} src={src('light')} className={cn(className, 'dark:hidden')} alt={alt} />
            <Image {...props} src={src('dark')} className={cn(className, 'not-dark:hidden')} alt={alt} />
        </>
    );
}
