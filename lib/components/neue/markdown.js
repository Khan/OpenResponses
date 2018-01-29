import React from "react";
import { css, StyleSheet } from "aphrodite";

import renderMarkdown from "../../markdown";
import sharedStyles from "../../styles";
import type { Markdown } from "../../markdown";

export default ({ content }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: renderMarkdown(content, css(styles.paragraph)),
    }}
  />
);

const styles = StyleSheet.create({
  paragraph: {
    ...sharedStyles.wbTypography.body,
    [":first-child"]: {
      marginTop: 0,
    },
    [":last-child"]: {
      marginBottom: 0,
    },
  },
});
