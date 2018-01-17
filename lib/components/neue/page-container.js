import React from "react";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../../media-queries";

const PageContainer = ({ children }) => {
  return (
    <div className={css(styles.outerContainer)}>
      <div className={css(styles.innerContainer)}>{children}</div>
    </div>
  );
};
export default PageContainer;

const styles = StyleSheet.create({
  outerContainer: {
    display: "flex",
    height: "100vh",
    [mediaQueries.lgOrLarger]: {
      marginTop: 150,
      justifyContent: "center",
    },
  },

  innerContainer: {
    backgroundColor: "red",
    width: "100%",
    height: "100%",
    [mediaQueries.lgOrLarger]: {
      maxHeight: 1000,
      width: 800,
    },
  },
});
