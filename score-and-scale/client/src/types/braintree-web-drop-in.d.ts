// client/src/types/braintree-web-drop-in.d.ts
declare module "braintree-web-drop-in" {
  export interface Dropin {
    requestPaymentMethod: () => Promise<{ nonce: string; type: string }>;
    teardown: () => Promise<void>;
    on: (event: string, handler: (...args: any[]) => void) => void;
  }
}