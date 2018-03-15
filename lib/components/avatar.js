// @flow
import React from "react";
import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../styles";

const Avatar = ({ avatar, isSmall }: { avatar: string, isSmall?: boolean }) => (
  <div className={css(styles.avatar, isSmall ? styles.isSmall : undefined)}>
    {avatar ? (
      <img src={`/static/avatars/${avatar}.png`} style={{ width: "100%" }} />
    ) : null}
  </div>
);

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    overflow: "none",
    width: 44,
    height: 44,
    backgroundColor: sharedStyles.wbColors.offBlack10Opaque,
    borderRadius: 24,
    marginRight: 12,
    flexShrink: 0,
  },

  isSmall: {
    width: 26,
    height: 26,
    borderRadius: 12,
    marginRight: 0,
    border: "2px solid white",
    boxSizing: "border-box",
  },
});
