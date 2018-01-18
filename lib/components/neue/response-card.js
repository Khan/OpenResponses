import React from "react";
import { css, StyleSheet } from "aphrodite";

import Button from "../button";
import Card from "./card";
import RichEditor from "./rich-editor";
import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

type Props = {
  studentName: string,
};

const ResponseCard = (props: Props) => {
  return (
    <Card>
      <div className={css(styles.header)}>
        <div className={css(styles.avatar)} />
        <p className={css(styles.studentName)}>{props.studentName}</p>
      </div>
      <RichEditor
        placeholder="Type your response here."
        onChange={value => {
          props.onChange(value);
        }}
        data={props.data}
        editable
      />
      <div className={css(styles.footer)}>
        <div className={css(styles.hairline)} />
        <Button style={styles.submitButton}>Submit Response</Button>
      </div>
    </Card>
  );
};
export default ResponseCard;

const avatarSize = 44;
const styles = StyleSheet.create({
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: 14,
  },

  hairline: {
    height: 1,
    "@media (-webkit-min-device-pixel-ratio: 2.0)": {
      height: 0.5,
    },
    backgroundColor: sharedStyles.colors.gray85,
    position: "absolute",
    left: 0,
    marginTop: -14,
    width: "100%",
  },

  footer: {
    paddingTop: 14,
    marginTop: 14,
    display: "flex",
    flexDirection: "row-reverse",
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

  submitButton: {
    [mediaQueries.mdOrSmaller]: {
      width: "100%",
    },
  },
});
