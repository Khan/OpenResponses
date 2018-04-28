import React from "react";
import Tooltip from "rc-tooltip";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

const ImageButton = ({ imageURL, onClick, imageWidth, imageHeight }) => (
  <button className={css(styles.button)} onClick={onClick}>
    <img src={imageURL} style={{ width: imageWidth, height: imageHeight }} />
  </button>
);

export default ImageButton;

const styles = StyleSheet.create({
  button: {
    ...sharedStyles.wbTypography.labelMedium,
    padding: 0,
    border: "none",
    background: "none",
    margin: "-8px -12px",
    padding: "8px 12px",
    color: sharedStyles.wbColors.offBlack50,
    boxSizing: "border-box",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    // height: 36,
    outline: "none",

    [":hover"]: {
      borderRadius: sharedStyles.borderRadius,
      backgroundColor: sharedStyles.wbColors.white,
      boxShadow:
        "0 2px 4px 0 rgba(33, 36, 44, 0.16), 0 0 0 1px rgba(33, 36, 44, 0.08)",
    },

    [":active"]: {
      backgroundColor: "#dae6fd",
    },
  },
});
