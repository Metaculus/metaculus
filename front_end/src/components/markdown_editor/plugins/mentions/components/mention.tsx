import { BeautifulMentionComponentProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";

const CustomMentionComponent = forwardRef<
  HTMLAnchorElement,
  BeautifulMentionComponentProps
>(({ trigger, value, data: myData, children, ...other }, ref) => {
  return (
    <span {...other} ref={ref}>
      {trigger + value}
    </span>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

export default CustomMentionComponent;
