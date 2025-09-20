/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    BASE_RPC_URL?: string;
    OPERATOR_PRIVATE_KEY?: string;
    USDC_CONTRACT?: string;
    NEXT_PUBLIC_APP_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}