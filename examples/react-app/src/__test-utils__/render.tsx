import {
    render as baseRender,
    renderHook as baseRenderHook,
    RenderHookOptions,
    RenderOptions,
} from '@testing-library/react';
import { ComponentType, ReactElement, ReactNode, StrictMode } from 'react';

function composeWithStrictMode(
    Inner: ComponentType<{ children: ReactNode }> | undefined,
): ComponentType<{ children: ReactNode }> {
    return function StrictModeWrapper({ children }) {
        return <StrictMode>{Inner ? <Inner>{children}</Inner> : children}</StrictMode>;
    };
}

export function renderHook<TResult, TProps>(
    callback: (props: TProps) => TResult,
    options?: RenderHookOptions<TProps>,
): ReturnType<typeof baseRenderHook<TResult, TProps>> {
    return baseRenderHook(callback, { ...options, wrapper: composeWithStrictMode(options?.wrapper) });
}

export function render(ui: ReactElement, options?: RenderOptions): ReturnType<typeof baseRender> {
    return baseRender(ui, { ...options, wrapper: composeWithStrictMode(options?.wrapper) });
}
