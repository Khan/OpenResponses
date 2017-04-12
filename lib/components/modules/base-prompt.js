// @flow
import { StyleSheet, css } from "aphrodite";
import type { Children } from "react";

import sharedStyles from "../../styles.js";

export default (props: { children: Children }) => (
  <div className={css(styles.promptContainer)}>{props.children}</div>
);

const styles = StyleSheet.create({
  promptContainer: {
    width: 494,
    marginLeft: "auto",
    marginRight: "auto"
  }
});
