/* eslint-disable @typescript-eslint/no-floating-promises */
import { getPublicKeyFromPrivateKey } from '../public-key';

getPublicKeyFromPrivateKey(new CryptoKey()) satisfies Promise<CryptoKey>;
// eslint-disable-next-line @typescript-eslint/no-deprecated
getPublicKeyFromPrivateKey(new CryptoKey(), true) satisfies Promise<CryptoKey>;
// eslint-disable-next-line @typescript-eslint/no-deprecated
getPublicKeyFromPrivateKey(new CryptoKey(), false) satisfies Promise<CryptoKey>;
