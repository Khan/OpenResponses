import React from "react";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

const Card = ({ children }) => {
  return <div className={css(styles.container)}>{children}</div>;
};
export default Card;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 14,
    backgroundColor: "white",
    ...sharedStyles.hairlineBorderStyle,
    borderRadius: sharedStyles.borderRadius,

    [mediaQueries.mdOrSmaller]: {
      marginLeft: 14,
      marginRight: 14,
    },
  },
});
