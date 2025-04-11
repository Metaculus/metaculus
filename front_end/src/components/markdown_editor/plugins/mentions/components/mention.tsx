import { BeautifulMentionComponentProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";

const CustomMentionComponent = forwardRef<
  HTMLAnchorElement,
  BeautifulMentionComponentProps
>(({ trigger, value, data: myData, children, className, ...other }, ref) => {
  // combination on inline-block and block is used as a workaround for Chrome bug on Android
  // when element is duplicated when typing
  // github.com/facebook/lexical/issues/4636
  // https://issues.chromium.org/issues/41254240
  return (
    <span className="inline-block">
      <span {...other} ref={ref} className={className}>
        {trigger}({value})
      </span>
    </span>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

export default CustomMentionComponent;
