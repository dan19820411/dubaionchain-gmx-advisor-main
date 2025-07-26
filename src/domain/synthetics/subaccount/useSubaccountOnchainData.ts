import { useMemo } from "react";

import { getContract } from "config/contracts";
import { useMulticall } from "lib/multicall";
import { FREQUENT_UPDATE_INTERVAL } from "lib/timeConstants";
import {
  maxAllowedSubaccountActionCountKey,
  SUBACCOUNT_ORDER_ACTION,
  subaccountActionCountKey,
  subaccountExpiresAtKey,
  subaccountListKey,
} from "sdk/configs/dataStore";

export type SubaccountOnchainData = {
  active: boolean;
  maxAllowedCount: bigint;
  currentActionsCount: bigint;
  expiresAt: bigint;
  approvalNonce: bigint;
};

export type SubaccountOnchainDataResult = {
  subaccountData: SubaccountOnchainData | undefined;
  refreshSubaccountData: () => void;
};

export function useSubaccountOnchainData(
  chainId: number,
  {
    account,
    subaccountAddress,
  }: {
    account: string | undefined;
    subaccountAddress: string | undefined;
  }
): SubaccountOnchainDataResult {
  const { data, mutate } = useMulticall(chainId, "useSubaccountOnchainData", {
    key: account && subaccountAddress ? [account, subaccountAddress] : null,
    refreshInterval: FREQUENT_UPDATE_INTERVAL,

    request: () => {
      if (!account || !subaccountAddress) {
        return {} as any;
      }

      return {
        subaccountRelayRouter: {
          contractAddress: getContract(chainId, "SubaccountGelatoRelayRouter"),
          abiId: "SubaccountGelatoRelayRouter",
          calls: {
            subaccountApproval: {
              methodName: "subaccountApprovalNonces",
              params: [account],
            },
          },
        },
        dataStore: {
          contractAddress: getContract(chainId, "DataStore"),
          abiId: "DataStore",
          calls: {
            isSubaccountActive: {
              methodName: "containsAddress",
              params: [subaccountListKey(account!), subaccountAddress],
            },
            maxAllowedActionsCount: {
              methodName: "getUint",
              params: [maxAllowedSubaccountActionCountKey(account!, subaccountAddress, SUBACCOUNT_ORDER_ACTION)],
            },
            currentActionsCount: {
              methodName: "getUint",
              params: [subaccountActionCountKey(account!, subaccountAddress, SUBACCOUNT_ORDER_ACTION)],
            },
            expiresAt: {
              methodName: "getUint",
              params: [subaccountExpiresAtKey(account!, subaccountAddress, SUBACCOUNT_ORDER_ACTION)],
            },
          },
        },
      };
    },
    parseResponse: (res) => {
      const isSubaccountActive = Boolean(res.data.dataStore.isSubaccountActive.returnValues[0]);
      const maxAllowedCount = BigInt(res.data.dataStore.maxAllowedActionsCount.returnValues[0]);
      const currentActionsCount = BigInt(res.data.dataStore.currentActionsCount.returnValues[0]);
      const expiresAt = BigInt(res.data.dataStore.expiresAt.returnValues[0]);
      const approvalNonce = BigInt(res.data.subaccountRelayRouter.subaccountApproval.returnValues[0]);
      return { active: isSubaccountActive, maxAllowedCount, currentActionsCount, expiresAt, approvalNonce };
    },
  });

  return useMemo(() => {
    return {
      subaccountData: data,
      refreshSubaccountData: mutate,
    };
  }, [data, mutate]);
}
