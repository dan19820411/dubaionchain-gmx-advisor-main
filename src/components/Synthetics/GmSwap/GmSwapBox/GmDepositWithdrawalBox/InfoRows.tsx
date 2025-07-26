import { t } from "@lingui/macro";
import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import { ExecutionFee } from "domain/synthetics/fees";
import { GmSwapFees } from "domain/synthetics/trade";

import { GmFees } from "components/Synthetics/GmSwap/GmFees/GmFees";
import { NetworkFeeRow } from "components/Synthetics/NetworkFeeRow/NetworkFeeRow";
import { SyntheticsInfoRow } from "components/Synthetics/SyntheticsInfoRow";

import { Operation } from "../types";

export function InfoRows({
  isDeposit,
  fees,
  executionFee,
}: {
  isDeposit: boolean;
  fees: GmSwapFees | undefined;
  executionFee: ExecutionFee | undefined;
}) {
  const [isExecutionDetailsOpen, setIsExecutionDetailsOpen] = useState(false);

  const toggleExecutionDetails = () => {
    setIsExecutionDetailsOpen(!isExecutionDetailsOpen);
  };

  return (
    <div className="flex flex-col gap-14">
      <div className="flex w-full flex-col gap-14">
        <GmFees
          operation={isDeposit ? Operation.Deposit : Operation.Withdrawal}
          totalFees={fees?.totalFees}
          swapFee={fees?.swapFee}
          swapPriceImpact={fees?.swapPriceImpact}
          uiFee={fees?.uiFee}
        />

        <SyntheticsInfoRow label={t`Execution Details`} onClick={toggleExecutionDetails}>
          {isExecutionDetailsOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </SyntheticsInfoRow>
        {isExecutionDetailsOpen ? <NetworkFeeRow rowPadding executionFee={executionFee} /> : null}
      </div>
    </div>
  );
}
