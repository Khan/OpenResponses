// @flow
import { StyleSheet, css } from "aphrodite";
import MarkdownIt from "markdown-it";

const markdownIt = MarkdownIt();

import sharedStyles from "../styles.js";

export default (props: { text: string }) => (
  <p
    className={css(styles.paragraph)}
    dangerouslySetInnerHTML={{ __html: markdownIt.renderInline(props.text) }}
  />
);

const styles = StyleSheet.create({
  paragraph: {
    ...sharedStyles.typography.bodyLarge
  }
});
