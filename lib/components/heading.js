// @flow
import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../styles.js";

export default (props: { children: string }) => (
  <h1 className={css(styles.header)}>{props.children}</h1>
);

const styles = StyleSheet.create({
  header: {
    ...sharedStyles.typography.subjectHeadingDesktop,
  },
});
