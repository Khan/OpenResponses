// @flow
import React from "react";
import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../styles";

const Avatar = ({ avatar }: { avatar: string }) => (
  <span className={css(styles.avatar)}>
    {avatar ? (
      <img src={`/static/avatars/${avatar}.png`} style={{ width: "100%" }} />
    ) : null}
  </span>
);

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    overflow: "none",
    width: 44,
    height: 44,
    backgroundColor: sharedStyles.wbColors.offBlack10,
    borderRadius: 24,
    marginRight: 12,
    flexShrink: 0,
  },
});
