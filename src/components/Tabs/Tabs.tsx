import cx from "classnames";

import NestedTab from "./NestedTab";
import RegularTab from "./RegularTab";
import { isNestedOption, Option, BaseOptionValue } from "./types";
import "./Tabs.css";

type Props<V extends BaseOptionValue> = {
  options: Option<V>[];
  selectedValue: V | undefined;
  onChange?: (value: V) => void;
  size?: "l" | "m";
  type?: "inline" | "block";
  className?: string;
  regularOptionClassname?: string;
  qa?: string;
};

export default function Tabs<V extends string | number>({
  options,
  selectedValue,
  onChange,
  size = "m",
  type = "block",
  className,
  regularOptionClassname,
  qa,
}: Props<V>) {
  return (
    <div data-qa={qa} className={cx("Tab", `Tab__${type}`, `Tab__${size}`, className)}>
      {options.map((opt) =>
        isNestedOption(opt) ? (
          <NestedTab key={opt.label?.toString()} option={opt} selectedValue={selectedValue} onOptionClick={onChange} />
        ) : (
          <RegularTab
            key={opt.value}
            option={opt}
            selectedValue={selectedValue}
            onOptionClick={onChange}
            regularOptionClassname={regularOptionClassname}
          />
        )
      )}
    </div>
  );
}
