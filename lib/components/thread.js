// @flow
import AnimateHeight from "react-animate-height";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import QuillEditor from "./quill-rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

import type { RichEditorData } from "./rich-editor";

const collapsedHeight = 82;

type PlaceholderThreadProps = {
  imageURL: string,
  title: string,
};

export const PlaceholderThread = ({
  imageURL,
  title,
}: PlaceholderThreadProps) => {
  return (
    <div className={css(styles.container, styles.collapsedContainer)}>
      <div className={css(styles.postContainer)}>
        <div className={css(styles.lock)}>
          <img src={imageURL} style={{ width: "100%" }} />
        </div>
        <div className={css(styles.contents)}>
          <p className={css(styles.studentName)}>{title}</p>
        </div>
      </div>
    </div>
  );
};

type PostDisplayData = {
  data: RichEditorData,

  displayName: string,
  avatar: string,
};

type PostProps = PostDisplayData & {
  onChange?: RichEditorData => void,
  onSubmit?: void => void,
  buttonTitle?: string,
  isEditable?: boolean,
  shouldShowSubmitButton?: boolean,
};

const Post = ({
  data,
  displayName,
  avatar,
  onChange,
  onSubmit,
  buttonTitle,
  isEditable,
  shouldShowSubmitButton,
}: PostProps) => (
  <div className={css(styles.postContainer)}>
    <Avatar avatar={avatar} />
    <div className={css(styles.contents)}>
      <p className={css(styles.studentName)}>{displayName}</p>
      <QuillEditor
        placeholder="Write your response here…"
        data={data}
        onChange={onChange}
        editable={isEditable}
      />
      {shouldShowSubmitButton ? (
        <Button onClick={onSubmit}>{buttonTitle}</Button>
      ) : null}
    </div>
  </div>
);

type PostCreatorProps = {
  avatar: string,
  displayName: string,
  prompts: string[],
  onSelectPrompt: (?number) => void,
};

const PostCreator = ({
  avatar,
  displayName,
  prompts,
  onSelectPrompt,
}: PostCreatorProps) => (
  <div className={css(styles.postContainer)}>
    <Avatar avatar={avatar} />
    <div className={css(styles.contents)}>
      <p className={css(styles.studentName)}>{displayName}</p>
      <div>
        {prompts.map((prompt, index) => (
          <Button
            onClick={() => onSelectPrompt(index)}
            type="SECONDARY"
            style={styles.postCreatorButton}
          >
            {prompt}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => onSelectPrompt(null)}
        type="SECONDARY"
        style={styles.postCreatorCustomReplyButton}
      >
        Write a custom reply…
      </Button>
    </div>
  </div>
);

type Props = {
  posts: PostDisplayData[],

  onChange: RichEditorData => void,
  onSubmit: void => void,

  onSetIsExpanded: boolean => void,
  isExpanded: boolean,

  pendingRichEditorData?: RichEditorData,
  pendingAvatar: string,
  pendingDisplayName: string,

  canAddReply: boolean,
  prompts: string[],
  onSelectPrompt: (?number) => void,
};

export default class Thread extends React.Component<Props, {}> {
  render() {
    const isExpanded = this.props.isExpanded;

    const post = this.props.posts[0] || {};
    const isEditable = true && isExpanded; // TODO
    return (
      <AnimateHeight
        className={css(styles.container)}
        height={isExpanded ? "auto" : collapsedHeight}
        duration={750}
      >
        <button
          className={css(styles.accordionButton)}
          style={{ display: this.props.isExpanded ? "none" : "initial" }}
          onClick={() => {
            this.props.onSetIsExpanded(true);
          }}
        >
          <div className={css(styles.accordionButtonIcon)}>v</div>
        </button>
        <div
          className={css(
            styles.threadInteriorContainer,
            this.props.isExpanded
              ? undefined
              : styles.threadInteriorContainerCollapsed,
          )}
        >
          {this.props.posts.map((post, index) => (
            <Post key={index} {...post} />
          ))}
          {this.props.pendingRichEditorData ? (
            <Post
              data={this.props.pendingRichEditorData}
              avatar={this.props.pendingAvatar}
              displayName={this.props.pendingDisplayName}
              onChange={this.props.onChange}
              onSubmit={this.props.onSubmit}
              buttonTitle="Share with class"
              isEditable={isEditable}
              shouldShowSubmitButton
            />
          ) : this.props.canAddReply ? (
            <PostCreator
              avatar={this.props.pendingAvatar}
              displayName={this.props.pendingDisplayName}
              prompts={this.props.prompts}
              onSelectPrompt={this.props.onSelectPrompt}
            />
          ) : null}
        </div>
        <button
          className={css(styles.accordionButtonIcon)}
          style={{ display: this.props.isExpanded ? "initial" : "none" }}
          onClick={() => {
            this.props.onSetIsExpanded(false);
          }}
        >
          ^
        </button>
      </AnimateHeight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    position: "relative",
    // overflow: "hidden",
    borderBottom: `1px solid ${sharedStyles.wbColors.hairline}`,
  },

  postContainer: {
    padding: 14,
    paddingTop: 10,
    display: "flex",
  },

  contents: {
    marginLeft: 0,
    flexGrow: 1,
  },

  studentName: {
    ...sharedStyles.wbTypography.labelLarge,
    margin: 0,
  },

  accordionButton: {
    border: "none",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    zIndex: "auto",
    cursor: "pointer",
    backgroundColor: "transparent",

    [":hover"]: {
      backgroundColor: "#dae6fd",
    },
    [":active"]: {
      backgroundColor: "rgba(16, 69, 164, 0.08);",
    },
  },

  accordionButtonIcon: {
    position: "absolute",
    right: 14,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    outline: "none",
    [":hover"]: {
      backgroundColor: "#dae6fd",
    },
    [":active"]: {
      backgroundColor: "rgba(16, 69, 164, 0.08)",
    },
  },

  collapsedContainer: {
    height: 82,
  },

  lock: {
    width: 44,
    height: 44,
    backgroundColor: sharedStyles.wbColors.offBlack10,
    marginRight: 12,
    flexShrink: 0,
  },

  threadInteriorContainer: {
    position: "relative",
  },

  threadInteriorContainerCollapsed: {
    pointerEvents: "none",
  },

  postCreatorButton: {
    width: "100%",
    maxWidth: 450,
    display: "block",
    textAlign: "left",

    borderRadius: 0,
    borderBottomWidth: 0,

    [":first-of-type"]: {
      marginTop: 8,
      borderTopLeftRadius: sharedStyles.borderRadius,
      borderTopRightRadius: sharedStyles.borderRadius,
    },

    [":last-of-type"]: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: sharedStyles.borderRadius,
      borderBottomRightRadius: sharedStyles.borderRadius,
    },
  },

  postCreatorCustomReplyButton: {
    border: "none",
    marginTop: 8,
  },
});
