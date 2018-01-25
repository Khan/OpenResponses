// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

type CardStyle = "regular" | "peeking";

const Card = ({
  children,
  style,
}: {
  children: React.Children,
  style: CardStyle,
}) => {
  return (
    <div
      className={css(
        styles.container,
        style === "regular" ? styles.regularStyle : styles.peekingStyle,
      )}
    >
      {children}
    </div>
  );
};
export default Card;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 14,
    backgroundColor: "white",
    ...sharedStyles.hairlineBorderStyle,
    borderTopLeftRadius: sharedStyles.borderRadius,
    borderTopRightRadius: sharedStyles.borderRadius,

    [mediaQueries.mdOrSmaller]: {
      marginLeft: 14,
      marginRight: 14,
    },
  },

  regularStyle: {
    borderBottomLeftRadius: sharedStyles.borderRadius,
    borderBottomRightRadius: sharedStyles.borderRadius,
  },

  peekingStyle: {
    borderBottom: "none",
  },
});
