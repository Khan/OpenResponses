import React from "react";
import { css, StyleSheet } from "aphrodite";

import Card from "./card";
import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

type Props = {
  studentName: string,
};

const ResponseCard = (props: Props) => {
  return (
    <Card>
      <div className={css(styles.heading)}>
        <div className={css(styles.avatar)} />
        <p className={css(styles.studentName)}>{props.studentName}</p>
      </div>
      <h1>Testing</h1>
    </Card>
  );
};
export default ResponseCard;

const avatarSize = 44;
const styles = StyleSheet.create({
  heading: {
    display: "flex",
    alignItems: "center",
  },

  avatar: {
    width: avatarSize,
    height: avatarSize,
    backgroundColor: sharedStyles.colors.gray90,
    borderRadius: avatarSize / 2,
  },

  studentName: {
    ...sharedStyles.typography.subheadingMobile,
    color: sharedStyles.colors.gray25,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 12,
  },
});
