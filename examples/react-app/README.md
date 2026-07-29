# @solana/example-react-app

This is an example of how to use `@solana/kit` and `@solana/react` to build a React web application.

## Features

- Connects to browser wallets that support the Wallet Standard; one or more at a time
- Fetches and subscribes to the balance of the selected wallet
- Allows you to sign an arbitrary message using a wallet account
- Allows you to make a transfer from the selected wallet to any other connected wallet

## Developing

Start a server in development mode.

```shell
pnpm install
pnpm turbo compile:js compile:typedefs
pnpm dev
```

Press <kbd>o</kbd> + <kbd>Enter</kbd> to open the app in a browser. Edits to the source code will automatically reload the app.

## Building for deployment

Build a static bundle and HTML for deployment to a webserver.

```shell
pnpm install
pnpm turbo build
```

The contents of the `dist/` directory can now be uploaded to a webserver.

## Enabling Mainnet-Beta

The public Mainnet-Beta RPC endpoint is rate limited to the point of being unusable and is typically blocked by [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) rules from the browser, so Mainnet is hidden in the example app by default. To enable it, start the server or compile the application with the `REACT_EXAMPLE_APP_MAINNET_URL` environment variable set to your own Mainnet RPC endpoint. That URL becomes the app's Mainnet RPC endpoint, and the WebSocket subscriptions URL is derived from it (the `https` protocol is swapped for `wss`).

```shell
REACT_EXAMPLE_APP_MAINNET_URL=https://your-rpc-provider.example.com pnpm dev
REACT_EXAMPLE_APP_MAINNET_URL=https://your-rpc-provider.example.com pnpm build
```
