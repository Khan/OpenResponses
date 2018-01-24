// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import Card from "./card";
import RichEditor from "./rich-editor";
import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

type Props = {
  studentName: string,
  avatar: string,
  data: any, // TODO
  onChange: any => void, // TODO
  onFocus: void => void,
  placeholder: ?string,

  submitTitle: ?string,
  onSubmit: () => void,
};

const ResponseCard = (props: Props) => {
  const canSubmit = !!props.onSubmit;
  return (
    <Card>
      <RichEditor
        placeholder={props.placeholder || "Type your response here."}
        onChange={value => {
          props.onChange(value);
        }}
        data={props.data}
        onFocus={props.onFocus}
        editable={canSubmit}
      />
      <div className={css(styles.hairline)} />
      <div className={css(styles.footer)}>
        <Avatar avatar={props.avatar} />
        <p className={css(styles.studentName)}>{props.studentName}</p>
        {canSubmit ? (
          <Button style={styles.submitButton} onClick={props.onSubmit}>
            {props.submitTitle}
          </Button>
        ) : null}
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
      transform: "scaleY(0.5)",
    },
    backgroundColor: sharedStyles.colors.gray85,
    position: "absolute",
    left: 0,
    marginTop: 14,
    width: "100%",
  },

  footer: {
    paddingTop: 14,
    marginTop: 14,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: avatarSize,
    height: avatarSize,
    backgroundColor: sharedStyles.colors.gray90,
    borderRadius: avatarSize / 2,
  },

  studentName: {
    ...sharedStyles.wbTypography.labelLarge,
    color: sharedStyles.colors.gray25,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 12,
    flexGrow: 1,
  },

  submitButton: {
    justifySelf: "end",
    [mediaQueries.mdOrSmaller]: {
      // width: "100%",
    },
  },
});
