// @flow
import AnimateHeight from "react-animate-height";
import React, { Fragment } from "react";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import QuillEditor from "./quill-rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";
import validateSubmission from "../validate-submission";

import type { RichEditorData } from "./rich-editor";

const collapsedHeight = 76;

type PlaceholderThreadProps = {
  imageURL: string,
  title: string,
  secondaryText?: string,
};

export const PlaceholderThread = ({
  imageURL,
  title,
  secondaryText,
}: PlaceholderThreadProps) => {
  return (
    <div className={css(styles.container, styles.collapsedContainer)}>
      <div className={css(styles.postContainer, styles.placeholderContainer)}>
        <div
          className={css(styles.lock)}
          style={{ backgroundImage: `url(${imageURL})` }}
        />
        <div className={css(styles.contents)}>
          <p className={css(styles.studentName)}>{title}</p>
          {secondaryText ? (
            <p className={css(styles.placeholderSecondaryText)}>
              {secondaryText}
            </p>
          ) : null}
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
  onChooseDifferentSentenceStarter?: void => void,
  shouldShowSentenceStarterButton?: boolean,
};

class Post extends React.Component<PostProps, {}> {
  isPendingFocus = false;
  editorRef = null;

  componentDidMount = () => {
    // Super hacky autofocus implementation...
    if (this.props.isEditable && this.editorRef) {
      this.editorRef.focus();
      this.isPendingFocus = true;
    }
  };

  render() {
    const {
      data,
      displayName,
      avatar,
      onChange,
      onSubmit,
      buttonTitle,
      isEditable,
      onChooseDifferentSentenceStarter,
      shouldShowSentenceStarterButton,
    } = this.props;
    return (
      <div className={css(styles.postContainer)}>
        <Avatar avatar={avatar} />
        <div className={css(styles.contents)}>
          <p className={css(styles.studentName)}>{displayName}</p>
          <div className={css(styles.postBodyContainer)}>
            <AnimateHeight
              height={isEditable ? "auto" : 0}
              style={{ transition: "opacity 0.3s" }}
              duration={300}
              className={css(
                styles.postBodyOption,
                isEditable ? styles.postBodyShown : styles.postBodyHidden,
              )}
            >
              <div className={css(styles.editorContainer)}>
                <QuillEditor
                  placeholder="Write your response here…"
                  data={data}
                  onChange={onChange}
                  editable={isEditable}
                  ref={ref => (this.editorRef = ref)}
                />
              </div>
              <div className={css(styles.footerButtonContainer)}>
                {shouldShowSentenceStarterButton && (
                  <Button
                    type="SECONDARY"
                    onClick={onChooseDifferentSentenceStarter}
                    style={styles.chooseDifferentSentenceStarterButton}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={onSubmit}
                  style={styles.submitButton}
                  disabled={!validateSubmission(data)}
                >
                  {validateSubmission(data)
                    ? buttonTitle
                    : "Write a little more?"}
                </Button>
              </div>
            </AnimateHeight>
            <AnimateHeight
              height={isEditable ? 0 : "auto"}
              duration={100}
              className={css(
                styles.postBodyOption,
                isEditable ? styles.postBodyHidden : styles.postBodyShown,
              )}
              style={{ left: "-100%", transition: "opacity 0.3s" }}
            >
              <div
                className="flattenedUserContent"
                dangerouslySetInnerHTML={{ __html: data && data.rawData }}
              />
              <style global jsx>
                {`
                  .flattenedUserContent :global(p) {
                    font-family: ${sharedStyles.wbTypography.body.fontFamily};
                    font-size: ${sharedStyles.wbTypography.body.fontSize}px;
                    line-height: ${sharedStyles.wbTypography.body.lineHeight};
                    margin: 0;
                  }
                `}
              </style>
            </AnimateHeight>
          </div>
        </div>
      </div>
    );
  }
}

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
            key={index}
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
  onChooseDifferentSentenceStarter: void => void,

  shouldDisplayLookingForFeedbackMessage: boolean,
};

export default class Thread extends React.Component<Props, {}> {
  render() {
    const isExpanded = this.props.isExpanded;
    const shouldDisplayLookingForFeedbackMessage =
      !isExpanded && this.props.shouldDisplayLookingForFeedbackMessage;

    const postElements = this.props.posts.map((post, index) => (
      <Post key={index} {...post} />
    ));
    if (this.props.pendingRichEditorData) {
      postElements.push(
        <Post
          key={this.props.posts.length}
          data={this.props.pendingRichEditorData}
          avatar={this.props.pendingAvatar}
          displayName={this.props.pendingDisplayName}
          onChange={this.props.onChange}
          onSubmit={this.props.onSubmit}
          buttonTitle="Share with class"
          isEditable
          onChooseDifferentSentenceStarter={
            this.props.onChooseDifferentSentenceStarter
          }
          shouldShowSentenceStarterButton={this.props.canAddReply}
        />,
      );
    } else if (this.props.canAddReply) {
      postElements.push(
        <PostCreator
          key={this.props.posts.length}
          avatar={this.props.pendingAvatar}
          displayName={this.props.pendingDisplayName}
          prompts={this.props.prompts}
          onSelectPrompt={this.props.onSelectPrompt}
        />,
      );
    }

    const post = this.props.posts[0] || {};
    return (
      <div className={css(styles.container)}>
        <AnimateHeight
          height={
            isExpanded
              ? "auto"
              : collapsedHeight -
                (shouldDisplayLookingForFeedbackMessage ? 20 : 0)
          }
          duration={750}
        >
          <button
            className={css(
              styles.accordionButton,
              this.props.isExpanded ? styles.accordionCaretDisabled : undefined,
            )}
            onClick={() => {
              this.props.onSetIsExpanded(true);
            }}
          >
            <div
              className={css(
                styles.accordionButtonIcon,
                this.props.isExpanded
                  ? styles.accordionCaretUp
                  : styles.accordionCaretDown,
              )}
            />
          </button>
          <div
            className={css(
              styles.threadInteriorContainer,
              this.props.isExpanded
                ? undefined
                : styles.threadInteriorContainerCollapsed,
            )}
          >
            {postElements}
          </div>
          <button
            className={css(
              styles.accordionButtonIcon,
              this.props.isExpanded
                ? styles.accordionCaretUp
                : styles.accordionCaretDown,
              this.props.isExpanded ? undefined : styles.accordionCaretDisabled,
            )}
            onClick={() => {
              this.props.onSetIsExpanded(false);
            }}
          />
        </AnimateHeight>
        <div
          className={css(styles.chyron)}
          style={{
            opacity: shouldDisplayLookingForFeedbackMessage ? 1 : 0,
            transition: shouldDisplayLookingForFeedbackMessage
              ? "opacity 0.5s 1s"
              : "",
          }}
        >
          Looking for replies…
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    position: "relative",
    // overflow: "hidden",
    borderBottom: `1px solid ${sharedStyles.wbColors.hairline}`,
    paddingBottom: 6,
    minHeight: collapsedHeight,
  },

  postContainer: {
    padding: 14,
    paddingTop: 10,
    display: "flex",
    [":last-of-type"]: {
      paddingBottom: 8,
    },
  },

  contents: {
    marginLeft: 0,
    flexGrow: 1,
  },

  studentName: {
    ...sharedStyles.wbTypography.labelLarge,
    margin: 0,
  },

  postBodyContainer: {
    display: "flex",
  },

  editorContainer: {
    backgroundColor: sharedStyles.wbColors.offWhite,
    borderRadius: sharedStyles.borderRadius,
    padding: 8,
    marginTop: 8,
    marginBottom: 16,
  },

  postBodyOption: {
    position: "relative",
    width: "100%",
    flexShrink: 0,
    flexGrow: 1,
    boxSizing: "border-box",
  },

  postBodyHidden: {
    opacity: 0,
    pointerEvents: "none",
  },

  postBodyShown: {
    opacity: 1,
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
    outline: "none",
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
    right: 5,
    top: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "url(/static/caret@3x.png)",
    backgroundSize: "6px 10px",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    outline: "none",
    transition: "transform 0.5s",
    [":hover"]: {
      backgroundColor: "#dae6fd",
    },
    [":active"]: {
      backgroundColor: "rgba(16, 69, 164, 0.08)",
    },
  },

  collapsedContainer: {
    height: collapsedHeight + 6,
  },

  placeholderContainer: {
    alignItems: "center",
    boxSizing: "border-box",
    height: "100%",
  },

  lock: {
    width: 44,
    height: 44,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "center",
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

  chooseDifferentSentenceStarterButton: {
    border: "none",
    marginRight: 8,
  },

  accordionCaretDown: {
    transform: "rotate(-90deg)",
  },

  accordionCaretUp: {
    transform: "rotate(90deg)",
  },

  accordionCaretDisabled: {
    opacity: 0,
    pointerEvents: "none",
  },

  placeholderSecondaryText: {
    ...sharedStyles.wbTypography.body,
    margin: 0,
    color: `${sharedStyles.wbColors.offBlack}A3`,
  },

  footerButtonContainer: {
    display: "flex",
    justifyContent: "flex-end",
  },

  chyron: {
    ...sharedStyles.wbTypography.labelMedium,
    color: `${sharedStyles.wbColors.offBlack}A3`,
    position: "absolute",
    bottom: 9,
    left: 70,
    width: "100%",
    pointerEvents: "none",
  },
});
