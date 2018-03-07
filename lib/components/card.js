// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

type CardStyle = "regular" | "peeking";

const Card = ({
  children,
  style,
  highlight,
}: {
  children: React.Children,
  style: CardStyle,
  highlight: ?boolean,
}) => {
  return (
    <div
      className={css(
        styles.container,
        highlight ? styles.highlight : undefined,
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
    boxShadow: `0px -3px 15px 5px ${sharedStyles.colors.gray90}f0`,

    // Make sure the white extends into the next card when they're stacked.
    paddingBottom: 14 + sharedStyles.borderRadius,
    marginBottom: -sharedStyles.borderRadius,
  },

  highlight: {
    borderColor: sharedStyles.wbColors.productGold,
    borderWidth: 3,
    "@media (-webkit-min-device-pixel-ratio: 2.0)": {
      borderColor: sharedStyles.wbColors.productGold,
      borderWidth: 3,
    },
  },
});
