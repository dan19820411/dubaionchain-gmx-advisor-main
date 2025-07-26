import { Plural, t, Trans } from "@lingui/macro";
import cx from "classnames";
import uniq from "lodash/uniq";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useMedia } from "react-use";

import { getSyntheticsListSectionKey } from "config/localStorage";
import { usePendingTxns } from "context/PendingTxnsContext/PendingTxnsContext";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useClosingPositionKeyState, useTokensData } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { useCancellingOrdersKeysState } from "context/SyntheticsStateContext/hooks/orderEditorHooks";
import { useOrderErrorsCount } from "context/SyntheticsStateContext/hooks/orderHooks";
import { selectChartToken } from "context/SyntheticsStateContext/selectors/chartSelectors";
import { selectClaimablesCount } from "context/SyntheticsStateContext/selectors/claimsSelectors";
import { selectExpressGlobalParams } from "context/SyntheticsStateContext/selectors/expressSelectors";
import {
  selectChainId,
  selectOrdersInfoData,
  selectPositionsInfoData,
} from "context/SyntheticsStateContext/selectors/globalSelectors";
import { selectOrdersCount } from "context/SyntheticsStateContext/selectors/orderSelectors";
import {
  selectTradeboxMaxLiquidityPath,
  selectTradeboxSetActivePosition,
  selectTradeboxState,
  selectTradeboxTradeFlags,
} from "context/SyntheticsStateContext/selectors/tradeboxSelectors";
import { useCalcSelector } from "context/SyntheticsStateContext/SyntheticsStateContextProvider";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { estimateBatchExpressParams } from "domain/synthetics/express/expressOrderUtils";
import { useExternalSwapHandler } from "domain/synthetics/externalSwaps/useExternalSwapHandler";
import { OrderTypeFilterValue } from "domain/synthetics/orders/ordersFilters";
import { sendBatchOrderTxn } from "domain/synthetics/orders/sendBatchOrderTxn";
import type { OrderInfo } from "domain/synthetics/orders/types";
import { useOrderTxnCallbacks } from "domain/synthetics/orders/useOrderTxnCallbacks";
import { useSetOrdersAutoCancelByQueryParams } from "domain/synthetics/orders/useSetOrdersAutoCancelByQueryParams";
import { TradeMode } from "domain/synthetics/trade";
import { useTradeParamsProcessor } from "domain/synthetics/trade/useTradeParamsProcessor";
import { useInterviewNotification } from "domain/synthetics/userFeedback/useInterviewNotification";
import { getMidPrice } from "domain/tokens";
import { useChainId } from "lib/chains";
import { defined } from "lib/guards";
import { getPageTitle } from "lib/legacy";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { useMeasureComponentMountTime } from "lib/metrics/useMeasureComponentMountTime";
import { formatUsdPrice } from "lib/numbers";
import { EMPTY_ARRAY, getByKey } from "lib/objects";
import { useEthersSigner } from "lib/wallets/useEthersSigner";
import useWallet from "lib/wallets/useWallet";
import { getTokenVisualMultiplier } from "sdk/configs/tokens";
import { getOrderKeys } from "sdk/utils/orders";

import Checkbox from "components/Checkbox/Checkbox";
import Footer from "components/Footer/Footer";
import { InterviewModal } from "components/InterviewModal/InterviewModal";
import { NpsModal } from "components/NpsModal/NpsModal";
import { OneClickPromoBanner } from "components/OneClickPromoBanner/OneClickPromoBanner";
import { Claims } from "components/Synthetics/Claims/Claims";
import { OrderList } from "components/Synthetics/OrderList/OrderList";
import { PositionEditor } from "components/Synthetics/PositionEditor/PositionEditor";
import { PositionList } from "components/Synthetics/PositionList/PositionList";
import { PositionSeller } from "components/Synthetics/PositionSeller/PositionSeller";
import { SwapCard } from "components/Synthetics/SwapCard/SwapCard";
import type { MarketFilterLongShortItemData } from "components/Synthetics/TableMarketFilter/MarketFilterLongShort";
import { useIsCurtainOpen } from "components/Synthetics/TradeBox/Curtain";
import { TradeBoxResponsiveContainer } from "components/Synthetics/TradeBox/TradeBoxResponsiveContainer";
import { TradeHistory } from "components/Synthetics/TradeHistory/TradeHistory";
import { Chart } from "components/Synthetics/TVChart/Chart";
import Tabs from "components/Tabs/Tabs";

export type Props = {
  openSettings: () => void;
};

enum ListSection {
  Positions = "Positions",
  Orders = "Orders",
  Trades = "Trades",
  Claims = "Claims",
}

export function SyntheticsPage(p: Props) {
  const { openSettings } = p;
  const { chainId } = useChainId();
  const { account } = useWallet();
  const calcSelector = useCalcSelector();
  const { setPendingTxns } = usePendingTxns();

  useExternalSwapHandler();

  const isMobile = useMedia("(max-width: 1100px)");

  const [isSettling, setIsSettling] = useState(false);
  const [listSection, setListSection] = useLocalStorageSerializeKey(
    getSyntheticsListSectionKey(chainId),
    ListSection.Positions
  );

  const [, setClosingPositionKeyRaw] = useClosingPositionKeyState();
  const setClosingPositionKey = useCallback(
    (key: string | undefined) => requestAnimationFrame(() => setClosingPositionKeyRaw(key)),
    [setClosingPositionKeyRaw]
  );

  const setActivePosition = useSelector(selectTradeboxSetActivePosition);

  useTradeParamsProcessor();
  useSetOrdersAutoCancelByQueryParams();

  const { isInterviewModalVisible, setIsInterviewModalVisible } = useInterviewNotification();

  const { chartToken } = useSelector(selectChartToken);

  const { errors: ordersErrorsCount, warnings: ordersWarningsCount } = useOrderErrorsCount();
  const ordersCount = useSelector(selectOrdersCount);
  const positionsCount = useSelector((s) => Object.keys(selectPositionsInfoData(s) || {}).length);
  const totalClaimables = useSelector(selectClaimablesCount);

  const { savedAllowedSlippage, shouldShowPositionLines, setShouldShowPositionLines } = useSettings();

  const {
    isCancelOrdersProcessing,
    selectedOrderKeys,
    setSelectedOrderKeys,
    onCancelSelectedOrders,
    onCancelOrder,
    marketsDirectionsFilter,
    setMarketsDirectionsFilter,
    orderTypesFilter,
    setOrderTypesFilter,
  } = useOrdersControl();

  const { maxLiquidity: swapOutLiquidity } = useSelector(selectTradeboxMaxLiquidityPath);
  const tokensData = useTokensData();
  const { fromTokenAddress, toTokenAddress } = useSelector(selectTradeboxState);
  const fromToken = getByKey(tokensData, fromTokenAddress);
  const toToken = getByKey(tokensData, toTokenAddress);

  const [selectedPositionOrderKey, setSelectedPositionOrderKey] = useState<string>();

  const handlePositionListOrdersClick = useCallback(
    (positionKey: string, orderKey: string | undefined) => {
      setListSection(ListSection.Orders);
      startTransition(() => {
        setSelectedPositionOrderKey(orderKey);

        if (orderKey) {
          setSelectedOrderKeys([orderKey]);
          setMarketsDirectionsFilter([]);
          setOrderTypesFilter([]);
        }
      });
    },
    [setListSection, setMarketsDirectionsFilter, setOrderTypesFilter, setSelectedOrderKeys]
  );

  const { isSwap, isTwap } = useSelector(selectTradeboxTradeFlags);

  useEffect(() => {
    if (!chartToken) return;

    const averagePrice = getMidPrice(chartToken.prices);
    const currentTokenPriceStr =
      formatUsdPrice(averagePrice, {
        visualMultiplier: isSwap ? 1 : chartToken.visualMultiplier,
      }) || "...";

    const prefix = isSwap ? "" : getTokenVisualMultiplier(chartToken);

    const title = getPageTitle(
      currentTokenPriceStr +
        ` | ${prefix}${chartToken?.symbol}${chartToken?.symbol ? " " : ""}${chartToken?.isStable ? "" : "USD"}`
    );
    document.title = title;
  }, [chartToken, isSwap]);

  const [, setIsCurtainOpen] = useIsCurtainOpen();

  const onSelectPositionClick = useCallback(
    (key: string, tradeMode?: TradeMode, showCurtain = false) => {
      const positionsInfoData = calcSelector(selectPositionsInfoData);
      const position = getByKey(positionsInfoData, key);

      if (!position) return;

      setActivePosition(getByKey(positionsInfoData, key), tradeMode);
      if (showCurtain) {
        setIsCurtainOpen(true);
      }
    },
    [calcSelector, setActivePosition, setIsCurtainOpen]
  );

  const renderOrdersTabTitle = useCallback(() => {
    if (!ordersCount) {
      return (
        <div>
          <Trans>Orders</Trans>
        </div>
      );
    }

    return (
      <div className="flex">
        <Trans>Orders ({ordersCount})</Trans>
        <div
          className={cx("relative top-3 size-6 rounded-full", {
            "bg-yellow-500": ordersWarningsCount > 0 && !ordersErrorsCount,
            "bg-red-500": ordersErrorsCount > 0,
          })}
        />
      </div>
    );
  }, [ordersCount, ordersErrorsCount, ordersWarningsCount]);

  const tabLabels = useMemo(
    () => ({
      [ListSection.Positions]: t`Positions${positionsCount ? ` (${positionsCount})` : ""}`,
      [ListSection.Orders]: renderOrdersTabTitle(),
      [ListSection.Trades]: t`Trades`,
      [ListSection.Claims]: totalClaimables > 0 ? t`Claims (${totalClaimables})` : t`Claims`,
    }),
    [positionsCount, renderOrdersTabTitle, totalClaimables]
  );
  const tabsOptions = useMemo(
    () =>
      Object.values(ListSection).map((value) => ({
        value,
        label: tabLabels[value],
      })),
    [tabLabels]
  );

  function renderClaims() {
    return (
      <Claims
        setIsSettling={setIsSettling}
        isSettling={isSettling}
        setPendingTxns={setPendingTxns}
        allowedSlippage={savedAllowedSlippage}
      />
    );
  }

  const handleTabChange = useCallback(
    (section: ListSection) => {
      setListSection(section);
      startTransition(() => {
        setOrderTypesFilter([]);
        setMarketsDirectionsFilter([]);
        setSelectedOrderKeys([]);
        setSelectedPositionOrderKey(undefined);
      });
    },
    [setListSection, setMarketsDirectionsFilter, setOrderTypesFilter, setSelectedOrderKeys]
  );

  useMeasureComponentMountTime({ metricType: "syntheticsPage", onlyForLocation: "#/trade" });

  return (
    <div
      className={cx("Exchange page-layout", {
        "!pb-[333px]": isMobile,
      })}
    >
      <div className="-mt-15 grid grow grid-cols-[1fr_auto] gap-12 px-32 pt-0 max-[1100px]:grid-cols-1 max-[800px]:p-10">
        {isMobile && <OneClickPromoBanner openSettings={openSettings} />}
        <div className="Exchange-left flex flex-col">
          <Chart />
          {!isMobile && (
            <div className="Exchange-lists large" data-qa="trade-table-large">
              <div className="Exchange-list-tab-container">
                <Tabs
                  options={tabsOptions}
                  selectedValue={listSection}
                  onChange={handleTabChange}
                  type="inline"
                  className="Exchange-list-tabs"
                  qa="exchange-list-tabs"
                />
                <div className="align-right Exchange-should-show-position-lines">
                  {listSection === ListSection.Orders && selectedOrderKeys.length > 0 && (
                    <button
                      className="muted cancel-order-btn text-body-medium"
                      disabled={isCancelOrdersProcessing}
                      type="button"
                      onClick={onCancelSelectedOrders}
                    >
                      <Plural value={selectedOrderKeys.length} one="Cancel order" other="Cancel # orders" />
                    </button>
                  )}
                  <Checkbox
                    isChecked={shouldShowPositionLines}
                    setIsChecked={setShouldShowPositionLines}
                    className={cx("muted chart-positions", { active: shouldShowPositionLines })}
                  >
                    <span>
                      <Trans>Chart positions</Trans>
                    </span>
                  </Checkbox>
                </div>
              </div>

              {listSection === ListSection.Positions && (
                <PositionList
                  onOrdersClick={handlePositionListOrdersClick}
                  onSelectPositionClick={onSelectPositionClick}
                  onClosePositionClick={setClosingPositionKey}
                  openSettings={openSettings}
                  onCancelOrder={onCancelOrder}
                />
              )}
              {listSection === ListSection.Orders && (
                <OrderList
                  selectedOrdersKeys={selectedOrderKeys}
                  setSelectedOrderKeys={setSelectedOrderKeys}
                  selectedPositionOrderKey={selectedPositionOrderKey}
                  setSelectedPositionOrderKey={setSelectedPositionOrderKey}
                  marketsDirectionsFilter={marketsDirectionsFilter}
                  setMarketsDirectionsFilter={setMarketsDirectionsFilter}
                  orderTypesFilter={orderTypesFilter}
                  setOrderTypesFilter={setOrderTypesFilter}
                  onCancelSelectedOrders={onCancelSelectedOrders}
                />
              )}
              {listSection === ListSection.Trades && <TradeHistory account={account} />}
              {listSection === ListSection.Claims && renderClaims()}
            </div>
          )}
        </div>

        {isMobile ? (
          <>
            <div className="absolute">
              <TradeBoxResponsiveContainer />
            </div>
            {isSwap && !isTwap && (
              <SwapCard maxLiquidityUsd={swapOutLiquidity} fromToken={fromToken} toToken={toToken} />
            )}
          </>
        ) : (
          <div className="w-[40rem] min-[1501px]:w-[41.85rem]">
            <TradeBoxResponsiveContainer />

            <div className="mt-12 flex flex-col gap-12">
              {isSwap && !isTwap && (
                <SwapCard maxLiquidityUsd={swapOutLiquidity} fromToken={fromToken} toToken={toToken} />
              )}
            </div>
          </div>
        )}

        {isMobile && (
          <div className="Exchange-lists small min-w-0" data-qa="trade-table-small">
            <div className="Exchange-list-tab-container">
              <Tabs
                options={tabsOptions}
                selectedValue={listSection}
                onChange={handleTabChange}
                type="inline"
                className="Exchange-list-tabs"
              />
            </div>
            {listSection === ListSection.Positions && (
              <PositionList
                onOrdersClick={handlePositionListOrdersClick}
                onSelectPositionClick={onSelectPositionClick}
                onClosePositionClick={setClosingPositionKey}
                openSettings={openSettings}
                onCancelOrder={onCancelOrder}
              />
            )}
            {listSection === ListSection.Orders && (
              <OrderList
                selectedOrdersKeys={selectedOrderKeys}
                setSelectedOrderKeys={setSelectedOrderKeys}
                selectedPositionOrderKey={selectedPositionOrderKey}
                setSelectedPositionOrderKey={setSelectedPositionOrderKey}
                marketsDirectionsFilter={marketsDirectionsFilter}
                setMarketsDirectionsFilter={setMarketsDirectionsFilter}
                orderTypesFilter={orderTypesFilter}
                setOrderTypesFilter={setOrderTypesFilter}
                onCancelSelectedOrders={onCancelSelectedOrders}
              />
            )}
            {listSection === ListSection.Trades && <TradeHistory account={account} />}
            {listSection === ListSection.Claims && renderClaims()}
          </div>
        )}
      </div>
      <PositionSeller />
      <PositionEditor />
      <InterviewModal type="trader" isVisible={isInterviewModalVisible} setIsVisible={setIsInterviewModalVisible} />
      <NpsModal />
      <Footer isMobileTradePage={isMobile} />
    </div>
  );
}

function useOrdersControl() {
  const chainId = useSelector(selectChainId);
  const signer = useEthersSigner();
  const [cancellingOrdersKeys, setCanellingOrdersKeys] = useCancellingOrdersKeysState();
  const [selectedOrderKeys, setSelectedOrderKeys] = useState<string[]>(EMPTY_ARRAY);

  const { makeOrderTxnCallback } = useOrderTxnCallbacks();

  const isCancelOrdersProcessing = cancellingOrdersKeys.length > 0;

  const [marketsDirectionsFilter, setMarketsDirectionsFilter] = useState<MarketFilterLongShortItemData[]>([]);
  const [orderTypesFilter, setOrderTypesFilter] = useState<OrderTypeFilterValue[]>([]);
  const ordersInfoData = useSelector(selectOrdersInfoData);
  const globalExpressParams = useSelector(selectExpressGlobalParams);

  const onCancelSelectedOrders = useCallback(
    async function cancelSelectedOrders() {
      if (!signer) return;
      const orders = selectedOrderKeys.map((key) => getByKey(ordersInfoData, key)).filter(defined) as OrderInfo[];
      const orderKeys = orders.flatMap(getOrderKeys);
      setCanellingOrdersKeys((p) => uniq(p.concat(orderKeys)));

      const batchParams = {
        createOrderParams: [],
        updateOrderParams: [],
        cancelOrderParams: orderKeys.map((key) => ({ orderKey: key })),
      };

      const expressParams = await estimateBatchExpressParams({
        signer,
        chainId,
        batchParams,
        globalExpressParams,
        requireValidations: true,
        estimationMethod: "approximate",
        provider: undefined,
      });

      sendBatchOrderTxn({
        chainId,
        signer,
        expressParams,
        batchParams,
        simulationParams: undefined,
        noncesData: globalExpressParams?.noncesData,
        callback: makeOrderTxnCallback({}),
      })
        .then(async (tx) => {
          const txnResult = await tx.wait();
          if (txnResult?.status === "success") {
            setSelectedOrderKeys(EMPTY_ARRAY);
          }
        })
        .finally(() => {
          setCanellingOrdersKeys((p) => p.filter((e) => !orderKeys.includes(e)));
        });
    },
    [
      chainId,
      globalExpressParams,
      makeOrderTxnCallback,
      ordersInfoData,
      selectedOrderKeys,
      setCanellingOrdersKeys,
      signer,
    ]
  );

  const onCancelOrder = useCallback(
    async function cancelOrder(key: string) {
      if (!signer) return;
      const order = getByKey(ordersInfoData, key);
      if (!order) return;

      const orderKeys = getOrderKeys(order);

      setCanellingOrdersKeys((p) => uniq(p.concat(orderKeys)));

      const batchParams = {
        createOrderParams: [],
        updateOrderParams: [],
        cancelOrderParams: orderKeys.map((key) => ({ orderKey: key })),
      };

      const expressParams = await estimateBatchExpressParams({
        signer,
        chainId,
        batchParams,
        globalExpressParams,
        requireValidations: true,
        estimationMethod: "approximate",
        provider: undefined,
      });

      sendBatchOrderTxn({
        chainId,
        signer,
        expressParams,
        batchParams,
        simulationParams: undefined,
        noncesData: globalExpressParams?.noncesData,
        callback: makeOrderTxnCallback({}),
      }).finally(() => {
        setCanellingOrdersKeys((prev) => prev.filter((k) => k !== key));
        setSelectedOrderKeys((prev) => prev.filter((k) => k !== key));
      });
    },
    [chainId, globalExpressParams, makeOrderTxnCallback, ordersInfoData, setCanellingOrdersKeys, signer]
  );

  return {
    isCancelOrdersProcessing,
    onCancelSelectedOrders,
    onCancelOrder,
    selectedOrderKeys,
    setSelectedOrderKeys,
    marketsDirectionsFilter,
    setMarketsDirectionsFilter,
    orderTypesFilter,
    setOrderTypesFilter,
  };
}
