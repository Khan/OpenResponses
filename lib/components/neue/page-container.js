import React from "react";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

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
    position: "absolute",
    width: "100%",
    height: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    backgroundColor: sharedStyles.colors.gray90,
    [mediaQueries.lgOrLarger]: {
      justifyContent: "center",
    },
  },

  innerContainer: {
    width: "100%",
    height: "100%",
    [mediaQueries.lgOrLarger]: {
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: 80,
      maxHeight: 1000,
      width: 800,
    },
  },
});
