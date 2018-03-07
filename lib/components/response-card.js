// @flow
import React from "react";
import Plain from "slate-plain-serializer";
import { css, StyleSheet } from "aphrodite";
import { Value } from "slate";

import { dataKind as slateDataKind } from "./slate-rich-editor";
import { dataKind as quillDataKind } from "./quill-rich-editor";

import Avatar from "./avatar";
import Button from "./button";
import Card from "./card";
import Markdown from "./markdown";
import RichEditor from "./rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

type Props = {
  studentName: string,
  avatar: string,

  data: any, // TODO
  placeholder?: string,
  subheading?: string, // i.e. for displaying jigsaw subgroups

  onChange: any => void, // TODO
  onFocus: void => void,

  highlight?: boolean,

  submitTitle?: string,
  onSubmit: () => void,

  isPeeking: boolean,
};

const validate = data => {
  if (data && data.kind === slateDataKind) {
    return Plain.serialize(Value.fromJSON(JSON.parse(data.rawData))).length > 0;
  } else if (data && data.kind === quillDataKind) {
    return data.rawData && data.rawData.length > 0;
  } else {
    return false;
  }
};

const ResponseCard = (props: Props) => {
  const canSubmit = !!props.onSubmit;
  return (
    <Card
      style={props.isPeeking ? "peeking" : "regular"}
      highlight={props.highlight}
    >
      {props.subheading ? (
        <h3 className={css(styles.subheading)}>{props.subheading}</h3>
      ) : null}
      {props.isPeeking ? (
        <div onClick={props.onFocus}>
          <Markdown content={props.placeholder} />
        </div>
      ) : (
        <RichEditor
          initialString={
            props.placeholder && props.placeholder.replace(/…$/, "&nbsp;")
          }
          placeholder={
            props.placeholder ? undefined : "Type your response here."
          }
          onChange={value => {
            props.onChange(value);
          }}
          data={props.data}
          onFocus={props.onFocus}
          editable={canSubmit}
          minHeight={props.isPeeking ? "unset" : undefined}
        />
      )}
      {!props.isPeeking ? (
        <React.Fragment>
          <div className={css(styles.hairline)} />
          <div className={css(styles.footer)}>
            <Avatar avatar={props.avatar} />
            <p className={css(styles.studentName)}>{props.studentName}</p>
            {canSubmit ? (
              <Button
                style={styles.submitButton}
                onClick={props.onSubmit}
                disabled={!validate(props.data)}
              >
                {props.submitTitle}
              </Button>
            ) : null}
          </div>
        </React.Fragment>
      ) : null}
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

  subheading: {
    ...sharedStyles.wbTypography.labelSmall,
    marginTop: 0,
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
    flexGrow: 1,
  },

  submitButton: {
    justifySelf: "end",
    [mediaQueries.mdOrSmaller]: {
      // width: "100%",
    },
  },
});
