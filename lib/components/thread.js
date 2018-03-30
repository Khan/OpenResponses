// @flow
import AnimateHeight from "react-animate-height";
import React, { Fragment } from "react";
import scrollToComponent from "react-scroll-to-component";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import QuillEditor from "./quill-rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";
import validateSubmission from "../validate-submission";

import type { RichEditorData } from "./rich-editor";

const collapsedHeight = 107;

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
  onChange?: RichEditorData => any,
  onSubmit?: void => any,
  buttonTitle?: string,
  isEditable?: boolean,
  onChooseDifferentSentenceStarter?: void => any,
  shouldShowSentenceStarterButton?: boolean,
  shouldAutofocus?: boolean,
  shouldShowThreadIndicator?: boolean,
};

class Post extends React.Component<PostProps, {}> {
  isPendingFocus = false;
  editorRef = null;
  postBodyContainerRef = null;

  componentDidMount = () => {
    // Super hacky autofocus implementation...
    if (this.props.isEditable && this.props.shouldAutofocus && this.editorRef) {
      this.editorRef.focus();
      this.isPendingFocus = true;

      if (this.postBodyContainerRef && window.innerHeight < 800) {
        scrollToComponent(this.postBodyContainerRef, {
          align: "top",
          offset: -80,
          duration: 400,
          ease: "outExpo",
        });
      }
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
      shouldShowThreadIndicator,
    } = this.props;
    return (
      <div className={css(styles.postContainer)}>
        <div
          className={css(styles.threadIndicatorOuter)}
          style={{ opacity: shouldShowThreadIndicator ? 1 : 0 }}
        >
          <div className={css(styles.threadIndicatorInner)} />
        </div>
        <Avatar avatar={avatar} />
        <div className={css(styles.contents)}>
          <p className={css(styles.studentName)}>{displayName}</p>
          <div
            className={css(styles.postBodyContainer)}
            ref={ref => (this.postBodyContainerRef = ref)}
          >
            <AnimateHeight
              height={isEditable ? "auto" : 0}
              style={{ transition: "opacity 0.5s" }}
              duration={600}
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
              duration={300}
              className={css(
                styles.postBodyOption,
                isEditable ? styles.postBodyHidden : styles.postBodyShown,
              )}
              style={{ left: "-100%", transition: "opacity 0.5s" }}
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
  shouldShowThreadIndicator: boolean,
  shouldAllowCustomReply: boolean,
};

const PostCreator = ({
  avatar,
  displayName,
  prompts,
  onSelectPrompt,
  shouldShowThreadIndicator,
  shouldAllowCustomReply,
}: PostCreatorProps) => (
  <div className={css(styles.postContainer)}>
    <div
      className={css(styles.threadIndicatorOuter)}
      style={{ opacity: shouldShowThreadIndicator ? 1 : 0 }}
    >
      <div className={css(styles.threadIndicatorInner)} />
    </div>
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
      {shouldAllowCustomReply && (
        <Button
          onClick={() => onSelectPrompt(null)}
          type="SECONDARY"
          style={styles.postCreatorCustomReplyButton}
        >
          Write a custom reply…
        </Button>
      )}
    </div>
  </div>
);

type Props = {
  posts: PostDisplayData[],

  onChange?: RichEditorData => any,
  onSubmit?: void => any,

  onSetIsExpanded?: boolean => any,
  isExpanded: boolean,

  pendingRichEditorData?: RichEditorData,
  pendingAvatar?: string,
  pendingDisplayName?: string,

  canAddReply: boolean,
  prompts: string[],
  onSelectPrompt?: (?number) => any,
  onChooseDifferentSentenceStarter?: void => any,
  shouldAllowCustomReply?: boolean,

  waitingForFeedback:
    | boolean
    | { hiddenCount: number, pendingPartnerCount: number },
  shouldAutofocus: boolean,
};

export default class Thread extends React.Component<Props, {}> {
  render() {
    const isExpanded = this.props.isExpanded;
    let shouldDisplayChyron = false;

    let chyron = null;
    if (this.props.waitingForFeedback !== false) {
      const {
        hiddenCount,
        pendingPartnerCount,
      } = this.props.waitingForFeedback;
      shouldDisplayChyron = true;
      chyron = (
        <div className={css(styles.chyron)}>
          <div className={css(styles.replyBannerAvatarBox)}>
            <div className={css(styles.replyBannerAvatar)}>
              <img
                src="/static/waiting@2x.png"
                className={css(styles.waitingIcon)}
              />
            </div>
          </div>
          <div
            className={css(
              styles.replyBannerLabel,
              styles.waitingForFeedbackLabel,
            )}
          >
            {hiddenCount
              ? `Reply to ${pendingPartnerCount} more partner${pendingPartnerCount >
                1
                  ? "s"
                  : ""} to unlock ${hiddenCount} repl${hiddenCount > 1
                  ? "ies"
                  : "y"}! `
              : "Waiting for feedback…"}
          </div>
        </div>
      );
    } else if (this.props.posts.length > 1) {
      shouldDisplayChyron = !isExpanded;
      chyron = (
        <div
          className={css(styles.chyron)}
          style={{
            opacity: isExpanded ? 0 : 1,
            transition: isExpanded ? "" : "opacity 0.5s 1s",
          }}
        >
          <div className={css(styles.replyBannerAvatarBox)}>
            {this.props.posts
              .slice(1) // skip the author
              .slice(-3) // take up to the last three
              .map(post => (
                <div className={css(styles.replyBannerAvatar)}>
                  <Avatar avatar={post.avatar} isSmall />
                </div>
              ))}
          </div>
          <div className={css(styles.replyBannerLabel)}>
            {`${this.props.posts.length - 1} ${this.props.posts.length - 1 > 1
              ? "replies"
              : "reply"}`}
          </div>
        </div>
      );
    }

    let pendingPost = null;
    if (this.props.pendingRichEditorData) {
      pendingPost = (
        <Post
          key={this.props.posts.length}
          data={this.props.pendingRichEditorData}
          avatar={this.props.pendingAvatar}
          displayName={this.props.pendingDisplayName}
          onChange={this.props.onChange}
          onSubmit={this.props.onSubmit}
          buttonTitle="Share with class"
          isEditable
          shouldAutofocus={this.props.shouldAutofocus}
          onChooseDifferentSentenceStarter={
            this.props.onChooseDifferentSentenceStarter
          }
          shouldShowSentenceStarterButton={this.props.canAddReply}
          shouldShowThreadIndicator={false}
        />
      );
    } else if (this.props.canAddReply) {
      pendingPost = (
        <PostCreator
          key={this.props.posts.length}
          avatar={this.props.pendingAvatar}
          displayName={this.props.pendingDisplayName}
          prompts={this.props.prompts}
          onSelectPrompt={this.props.onSelectPrompt}
          shouldShowThreadIndicator={
            this.props.shouldDisplayLookingForFeedbackMessage
          }
          shouldAllowCustomReply={!!this.props.shouldAllowCustomReply}
        />
      );
    }

    const postElements = this.props.posts.map((post, index) => (
      <Post
        key={index}
        {...post}
        shouldShowThreadIndicator={
          shouldDisplayChyron ||
          (isExpanded && !!pendingPost) ||
          index < this.props.posts.length - 1
        }
      />
    ));
    postElements.push(pendingPost);

    return (
      <div
        className={css(styles.container)}
        style={{
          paddingBottom: shouldDisplayChyron ? 32 : 6,
        }}
      >
        <AnimateHeight
          height={isExpanded ? "auto" : collapsedHeight - 28}
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
        {chyron}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    position: "relative",
    // overflow: "hidden",
    borderTop: `1px solid ${sharedStyles.wbColors.hairline}`,
    minHeight: collapsedHeight - 28,

    transition: "padding-bottom 0.5s",

    [mediaQueries.lgOrLarger]: {
      borderLeft: `1px solid ${sharedStyles.wbColors.hairline}`,
      borderRight: `1px solid ${sharedStyles.wbColors.hairline}`,

      borderBottomStyle: "none",
      [":first-of-type"]: {
        borderTopLeftRadius: sharedStyles.borderRadius,
        borderTopRightRadius: sharedStyles.borderRadius,
      },
    },

    [":last-of-type"]: {
      borderBottom: `1px solid ${sharedStyles.wbColors.hairline}`,
      [mediaQueries.lgOrLarger]: {
        borderBottomLeftRadius: sharedStyles.borderRadius,
        borderBottomRightRadius: sharedStyles.borderRadius,
      },
    },
  },

  postContainer: {
    padding: 14,
    paddingTop: 10,
    display: "flex",
    [":last-of-type"]: {
      paddingBottom: 8,
    },
    position: "relative",
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
    marginTop: 0,
    marginBottom: 0,

    [":hover"]: {
      backgroundColor: "rgba(30, 121, 251, 0.1)",
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
      backgroundColor: "rgba(30, 121, 251, 0.1)",
    },
    [":active"]: {
      backgroundColor: "rgba(16, 69, 164, 0.08)",
    },
  },

  collapsedContainer: {
    height: collapsedHeight - 28,
  },

  placeholderContainer: {
    alignItems: "center",
    boxSizing: "border-box",
    height: "100%",
    paddingTop: 8,
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

    whiteSpace: "normal",
    height: "auto",
    paddingTop: 12,
    paddingBottom: 12,
    boxSizing: "border-box",
    marginTop: 0,
    marginBottom: 0,

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
    position: "absolute",
    bottom: 9,
    boxSizing: "border-box",
    width: "100%",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },

  replyBannerAvatarBox: {
    marginLeft: 14,
    marginRight: 12,
    width: 44,
    height: 24,
    display: "flex",
    justifyContent: "center",
  },

  replyBannerAvatar: {
    flexShrink: 0,
    width: 14,
    marginLeft: -7,
    marginRight: 7,
  },

  replyBannerLabel: {
    flexGrow: 1,
    ...sharedStyles.wbTypography.labelMedium,
    color: sharedStyles.wbColors.secondaryBlack,
  },

  threadIndicatorOuter: {
    position: "absolute",
    top: 7,
    paddingTop: 49,
    boxSizing: "border-box",
    height: "100%",
    left: 34,
    width: 2,
    transition: "opacity 0.5s",
  },

  threadIndicatorInner: {
    backgroundColor: sharedStyles.wbColors.hairline,
    width: "100%",
    height: "100%",
  },

  waitingForFeedbackLabel: {
    color: `${sharedStyles.wbColors.offBlack}A3`,
  },

  waitingIcon: {
    width: 26,
    borderRadius: 12,
    backgroundColor: "white",
    border: "2px solid white",
    boxSizing: "border-box",
  },
});
