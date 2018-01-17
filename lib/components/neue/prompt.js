// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import renderMarkdown from "../../markdown";
import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";
import type { Markdown } from "../../markdown";

type Props = {
  title: string,
  prompt: Markdown,
};

const Prompt = (props: Props) => (
  <div className={css(styles.container)}>
    <h2 className={css(styles.title)}>{props.title}</h2>
    <div
      dangerouslySetInnerHTML={{
        __html: renderMarkdown(props.prompt, css(styles.paragraph)),
      }}
    />
  </div>
);

export default Prompt;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "white",
  },

  title: {
    ...sharedStyles.typography.conceptHeadingMobile,
    marginTop: 0,
  },

  paragraph: {
    ...sharedStyles.typography.bodyLarge,
    [":last-child"]: {
      marginBottom: 0,
    },
  },
});
