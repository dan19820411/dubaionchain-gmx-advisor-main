import type { Token } from "domain/tokens";

export type TokenPrices = {
  minPrice: bigint;
  maxPrice: bigint;
};

export type TokenData = Token & {
  prices: TokenPrices;
  balance?: bigint;
  totalSupply?: bigint;
  hasPriceFeedProvider?: boolean;
};

export type TokensRatio = {
  ratio: bigint;
  largestToken: Token;
  smallestToken: Token;
};

export type TokenToSpendParams = {
  tokenAddress: string;
  amount: bigint;
  allowanceData: TokensAllowanceData | undefined;
  isAllowanceLoaded: boolean | undefined;
};

export type TokenBalancesData = {
  [tokenAddress: string]: bigint;
};

export type TokenPricesData = {
  [address: string]: TokenPrices;
};

export type TokensAllowanceData = {
  [tokenAddress: string]: bigint;
};

export type TokensData = {
  [address: string]: TokenData;
};
