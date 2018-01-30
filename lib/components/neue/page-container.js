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
    width: "100%",
    height: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    [mediaQueries.lgOrLarger]: {
      justifyContent: "center",
    },
    "-webkit-overflow-scrolling": "touch",
  },

  innerContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    [mediaQueries.lgOrLarger]: {
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: 80,
      width: 800,
    },
  },
});
