import { selectChainId, selectTokensData } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { createSelector } from "context/SyntheticsStateContext/utils";
import { getTokenData } from "domain/synthetics/tokens";
import { TradeMode, TradeType } from "domain/synthetics/trade";
import { getToken, getTokenBySymbolSafe } from "sdk/configs/tokens";
import { createTradeFlags } from "sdk/utils/trade";

import { selectTradeboxFromTokenAddress, selectTradeboxToTokenAddress } from "./baseSelectors";
import { selectTradeboxTradeFlags } from "../tradeboxSelectors";

export const selectChartToken = createSelector((q) => {
  const fromTokenAddress = q(selectTradeboxFromTokenAddress);
  const toTokenAddress = q(selectTradeboxToTokenAddress);

  if (!fromTokenAddress || !toTokenAddress) {
    return {};
  }

  const chainId = q(selectChainId);
  const tradeFlags = createTradeFlags(TradeType.Swap, TradeMode.Market);
  const { isSwap } = tradeFlags;

  try {
    const fromToken = getToken(chainId, fromTokenAddress);
    const toToken = getToken(chainId, toTokenAddress);
    const chartToken = isSwap && toToken?.isStable && !fromToken?.isStable ? fromToken : toToken;
    const tokensData = q(selectTokensData);

    const symbol = chartToken.symbol;
    const tokenData = getTokenData(tokensData, chartToken?.address);

    return { chartToken: tokenData, symbol };
  } catch (e) {
    return {};
  }
});

/**
 * Returns 1 if swap or no visual multiplier
 */
export const selectSelectedMarketVisualMultiplier = createSelector((q) => {
  const { symbol } = q(selectChartToken);
  const { isSwap } = q(selectTradeboxTradeFlags);

  if (!symbol) {
    return 1;
  }

  const chainId = q(selectChainId);
  const token = getTokenBySymbolSafe(chainId, symbol);

  if (!token) {
    return 1;
  }

  if (!token.visualMultiplier || isSwap) {
    return 1;
  }

  return token.visualMultiplier;
});
