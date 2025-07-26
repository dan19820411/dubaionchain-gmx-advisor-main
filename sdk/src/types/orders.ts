import { MarketInfo } from "./markets";
import { TokenData, TokensRatio, TokensRatioAndSlippage } from "./tokens";
import { SwapPathStats, TriggerThresholdType } from "./trade";

export enum OrderType {
  // the order will be cancelled if the minOutputAmount cannot be fulfilled
  MarketSwap = 0,
  // @dev LimitSwap: swap token A to token B if the minOutputAmount can be fulfilled
  LimitSwap = 1,
  // @dev MarketIncrease: increase position at the current market price
  // the order will be cancelled if the position cannot be increased at the acceptablePrice
  MarketIncrease = 2,
  // @dev LimitIncrease: increase position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitIncrease = 3,
  // @dev MarketDecrease: decrease position at the curent market price
  // the order will be cancelled if the position cannot be decreased at the acceptablePrice
  MarketDecrease = 4,
  // @dev LimitDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitDecrease = 5,
  // @dev StopLossDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  StopLossDecrease = 6,
  // @dev Liquidation: allows liquidation of positions if the criteria for liquidation are met
  Liquidation = 7,
  // @dev StopIncrease: increase position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  StopIncrease = 8,
}

export type SwapOrderType = OrderType.MarketSwap | OrderType.LimitSwap;
export type IncreaseOrderType = OrderType.MarketIncrease | OrderType.LimitIncrease | OrderType.StopIncrease;
export type DecreaseOrderType = OrderType.MarketDecrease | OrderType.LimitDecrease | OrderType.StopLossDecrease;

export enum SwapPricingType {
  TwoStep = 0,
  Shift = 1,
  Atomic = 2,
}

export enum DecreasePositionSwapType {
  NoSwap = 0,
  SwapPnlTokenToCollateralToken = 1,
  SwapCollateralTokenToPnlToken = 2,
}

export type Order = {
  key: string;
  account: string;
  callbackContract: string;
  initialCollateralTokenAddress: string;
  marketAddress: string;
  decreasePositionSwapType: DecreasePositionSwapType;
  receiver: string;
  swapPath: string[];
  contractAcceptablePrice: bigint;
  contractTriggerPrice: bigint;
  callbackGasLimit: bigint;
  executionFee: bigint;
  initialCollateralDeltaAmount: bigint;
  minOutputAmount: bigint;
  sizeDeltaUsd: bigint;
  updatedAtTime: bigint;
  isFrozen: boolean;
  isLong: boolean;
  orderType: OrderType;
  shouldUnwrapNativeToken: boolean;
  autoCancel: boolean;
  data: string;
  uiFeeReceiver: string;
  validFromTime: bigint;
  title?: string;
};

export type SwapOrderInfo = Order & {
  isSwap: true;
  isTwap: false;
  swapPathStats?: SwapPathStats;
  triggerRatio?: TokensRatio | TokensRatioAndSlippage;
  initialCollateralToken: TokenData;
  targetCollateralToken: TokenData;
};

export type PositionOrderInfo = Order & {
  isSwap: false;
  isTwap: false;
  marketInfo: MarketInfo;
  swapPathStats?: SwapPathStats;
  indexToken: TokenData;
  initialCollateralToken: TokenData;
  targetCollateralToken: TokenData;
  acceptablePrice: bigint;
  triggerPrice: bigint;
  triggerThresholdType: TriggerThresholdType | undefined;
};

export type TwapOrderInfo<T extends PositionOrderInfo | SwapOrderInfo = PositionOrderInfo | SwapOrderInfo> = Omit<
  T,
  "isTwap"
> & {
  isSwap: T extends SwapOrderInfo ? true : false;
} & TwapOrderParams<T>;

export type OrderInfo = SwapOrderInfo | PositionOrderInfo | TwapOrderInfo;

export type OrdersData = {
  [orderKey: string]: Order;
};

export type OrdersInfoData = {
  [orderKey: string]: OrderInfo;
};

export type OrderTxnType = "create" | "update" | "cancel";

type SingleOrderParams = {
  key: string;
  isTwap: false;
  orderType: OrderType;
};

type TwapOrderParams<T extends SingleOrderParams = SingleOrderParams> = {
  key: string;
  isTwap: true;
  orders: T[];
  orderType: OrderType;
  twapId: string;
  numberOfParts: number;
};

export type OrderParams = SingleOrderParams | TwapOrderParams;
