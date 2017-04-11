import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../lib/styles.js";

export default () => {
  return <h1 className={css(styles.header)}>Hello, world.</h1>;
};

const styles = StyleSheet.create({
  header: {
    ...sharedStyles.typography.subjectHeadingDesktop
  }
});
