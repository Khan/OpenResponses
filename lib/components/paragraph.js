// @flow
import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../styles.js";

export default (props: { text: string }) => (
  <p className={css(styles.paragraph)}>{props.text}</p>
);

const styles = StyleSheet.create({
  paragraph: {
    ...sharedStyles.typography.bodyLarge
  }
});
