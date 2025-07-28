import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="stylesheet" href="https://use.typekit.net/chp6nhs.css" />
            </head>
            <body className="flex flex-col min-h-screen">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
