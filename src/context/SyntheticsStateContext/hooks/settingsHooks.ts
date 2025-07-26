import {
  selectDebugSwapMarketsConfig,
  selectExecutionFeeBufferBps,
  selectOracleKeeperInstancesConfig,
  selectSavedAcceptablePriceImpactBuffer,
  selectSavedAllowedSlippage,
  selectSetDebugSwapMarketsConfig,
  selectSetExecutionFeeBufferBps,
  selectSetOracleKeeperInstancesConfig,
  selectSetSavedAcceptablePriceImpactBuffer,
  selectSetSavedAllowedSlippage,
  selectSetShowDebugValues,
  selectShouldUseExecutionFeeBuffer,
  selectShowDebugValues,
} from "../selectors/settingsSelectors";
import { useSyntheticsStateSelector as useSelector } from "../SyntheticsStateContextProvider";

export const useShowDebugValues = () => useSelector(selectShowDebugValues);
export const useSetShowDebugValues = () => useSelector(selectSetShowDebugValues);
export const useSavedAllowedSlippage = () => useSelector(selectSavedAllowedSlippage);
export const useSetSavedAllowedSlippage = () => useSelector(selectSetSavedAllowedSlippage);
export const useExecutionFeeBufferBps = () => useSelector(selectExecutionFeeBufferBps);
export const useSetExecutionFeeBufferBps = () => useSelector(selectSetExecutionFeeBufferBps);
export const useSavedAcceptablePriceImpactBuffer = () => useSelector(selectSavedAcceptablePriceImpactBuffer);
export const useSetSavedAcceptablePriceImpactBuffer = () => useSelector(selectSetSavedAcceptablePriceImpactBuffer);
export const useShouldUseExecutionFeeBuffer = () => useSelector(selectShouldUseExecutionFeeBuffer);
export const useOracleKeeperInstancesConfig = () => useSelector(selectOracleKeeperInstancesConfig);
export const useSetOracleKeeperInstancesConfig = () => useSelector(selectSetOracleKeeperInstancesConfig);
export const useDebugSwapMarketsConfig = () => useSelector(selectDebugSwapMarketsConfig);
export const useSetDebugSwapMarketsConfig = () => useSelector(selectSetDebugSwapMarketsConfig);
