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
    [mediaQueries.lgOrLarger]: {
      justifyContent: "center",
    },
    "-webkit-overflow-scrolling": "touch",
    overflow: "auto",
  },

  innerContainer: {
    width: "100%",
    height: "100%",
    // transform: "translateZ(0)", // Necessary to lay out the fixed-position cards correctly.
    [mediaQueries.lgOrLarger]: {
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: 80,
      maxHeight: 1000,
      overflow: "hidden",
      width: 800,
    },
  },
});
