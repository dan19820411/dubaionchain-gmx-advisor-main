import { useEffect, useSyncExternalStore } from "react";
import { toast } from "react-toastify";

import { useChainId as useDisplayedChainId } from "lib/chains";
import useWallet from "lib/wallets/useWallet";

import { INVALID_NETWORK_TOAST_ID, getInvalidNetworkToastContent } from "components/Errors/errorToasts";

const toastSubscribe = (onStoreChange: () => void): (() => void) => {
  const cleanup = toast.onChange(({ id }) => {
    if (id === INVALID_NETWORK_TOAST_ID) {
      onStoreChange();
    }
  });

  return cleanup;
};

const toastGetSnapshot = () => toast.isActive(INVALID_NETWORK_TOAST_ID);

export function useRealChainIdWarning() {
  const { active: isConnected } = useWallet();
  const { chainId: displayedChainId, isConnectedToChainId } = useDisplayedChainId();

  const isActive = useSyncExternalStore(toastSubscribe, toastGetSnapshot);

  useEffect(() => {
    if (!isConnectedToChainId && !isActive && isConnected) {
      toast.error(getInvalidNetworkToastContent(displayedChainId), {
        toastId: INVALID_NETWORK_TOAST_ID,
        autoClose: false,
        closeButton: false,
        delay: 2000,
      });
    } else if ((isConnectedToChainId || !isConnected) && isActive) {
      toast.dismiss(INVALID_NETWORK_TOAST_ID);
    }
  }, [displayedChainId, isActive, isConnected, isConnectedToChainId]);

  useEffect(() => {
    return () => {
      toast.dismiss(INVALID_NETWORK_TOAST_ID);
    };
  }, []);
}
