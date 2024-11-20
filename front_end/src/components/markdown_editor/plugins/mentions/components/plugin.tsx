import { BeautifulMentionsPlugin } from "lexical-beautiful-mentions";
import { FC } from "react";

import useUserMentionsContext from "./default_mentions_context";
import { Menu, MenuItem } from "./menu";
import { queryMentions } from "../utils";

const MentionsPlugin: FC = () => {
  const { defaultUserMentions } = useUserMentionsContext();

  return (
    <BeautifulMentionsPlugin
      triggers={["@"]}
      onSearch={(trigger, queryString) =>
        queryMentions(trigger, queryString, defaultUserMentions)
      }
      menuComponent={Menu}
      menuItemComponent={MenuItem}
      menuItemLimit={false}
    />
  );
};

export default MentionsPlugin;
