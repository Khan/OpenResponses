// @flow
import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../styles.js";

export default (props: { text: string }) => (
  <h1 className={css(styles.header)}>{props.text}</h1>
);

const styles = StyleSheet.create({
  header: {
    ...sharedStyles.typography.subjectHeadingDesktop
  }
});
