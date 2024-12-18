import {
  BeautifulMentionsPlugin,
  useBeautifulMentions,
} from "lexical-beautiful-mentions";
import { FC, useEffect, useRef } from "react";

import useUserMentionsContext from "./default_mentions_context";
import { Menu, MenuItem } from "./menu";
import { queryMentions } from "../utils";

type Props = {
  initialMention?: string;
  isStuff?: boolean;
};

const MentionsPlugin: FC<Props> = ({ initialMention, isStuff }) => {
  const { defaultUserMentions } = useUserMentionsContext();
  const { insertMention } = useBeautifulMentions();

  const insertedReplyMention = useRef(false);

  useEffect(() => {
    if (initialMention && !insertedReplyMention.current) {
      insertMention({ trigger: "@", value: initialMention });
      insertedReplyMention.current = true;
    }
  }, [insertMention, initialMention]);

  return (
    <BeautifulMentionsPlugin
      triggers={["@"]}
      onSearch={(trigger, queryString) =>
        queryMentions(trigger, queryString, defaultUserMentions, isStuff)
      }
      menuComponent={Menu}
      menuItemComponent={MenuItem}
      menuItemLimit={false}
      autoSpace={false}
      allowSpaces={false}
    />
  );
};

export default MentionsPlugin;
