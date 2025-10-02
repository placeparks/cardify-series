// privyConfig.ts
import type { PrivyClientConfig } from '@privy-io/react-auth'
import { base, baseSepolia } from 'viem/chains'

export const privyConfig: PrivyClientConfig = {
  /* 1 ── sign-in methods shown in the modal */
  loginMethods: [
    'email', 
    'sms', 
    'google', 
    'wallet'
  ],

  /* 2 ── automatic embedded-wallet provisioning */
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },

  /* 3 ── external wallet connector(s) */
  externalWallets: {
    walletConnect: { enabled: false },
  },

  /* 4 ── chain scope for wallets */
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia, base],

  /* 5 ── UI ordering inside the modal */
  appearance: {
    walletList: ['metamask', 'wallet_connect'],
    showWalletLoginFirst: false, // social login first
    theme: 'light',
    accentColor: '#6366f1',
  },

  /* 6 ── Cross-origin configuration */
  legal: {
    termsAndConditionsUrl: 'https://cardify.com/terms',
    privacyPolicyUrl: 'https://cardify.com/privacy',
  },

  /* 7 ── Debug logging - removed as not supported in current version */
}
