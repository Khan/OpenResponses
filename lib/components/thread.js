// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import QuillEditor from "./quill-rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

type PostDisplayData = {
  data: any, // TODO

  displayName: string,
  avatar: string,
};

type PostProps = PostDisplayData & {
  onChange?: any => void,
  buttonTitle?: string,
  isEditable?: boolean,
};

const Post = ({
  data,
  displayName,
  avatar,
  onChange,
  buttonTitle,
  isEditable,
}: PostProps) => (
  <div className={css(styles.postContainer)}>
    <Avatar avatar={avatar} />
    <div className={css(styles.contents)}>
      <p className={css(styles.studentName)}>{displayName}</p>
      <QuillEditor
        placeholder="Write your response here…"
        minHeight="3em"
        data={data}
        onChange={onChange}
        editable={!!onChange}
      />
      {isEditable ? <Button>{buttonTitle}</Button> : null}
    </div>
  </div>
);

type Props = {
  posts: PostDisplayData[],

  onChange: any => void,

  onSetIsExpanded: boolean => void,
  isExpanded: boolean,

  pendingRichEditorData: any, // TODO
  pendingAvatar: string,
  pendingDisplayName: string,
};

export default class Thread extends React.Component<Props, {}> {
  render() {
    const isExpanded = this.props.isExpanded;

    const post = this.props.posts[0] || {};
    const isEditable = true && isExpanded; // TODO
    return (
      <div
        className={css(
          styles.container,
          !isExpanded && styles.collapsedContainer,
        )}
      >
        <button
          className={css(styles.accordionButton)}
          onClick={() => {
            this.props.onSetIsExpanded(!!!this.props.isExpanded);
          }}
        >
          {this.props.isExpanded ? "^" : "v"}
        </button>
        {this.props.posts.map(post => <Post {...post} />)}
        {this.props.showPendingPost ? (
          <Post
            data={this.props.pendingRichEditorData}
            avatar={this.props.pendingAvatar}
            displayName={this.props.pendingDisplayName}
            onChange={this.props.onChange}
            buttonTitle="Share with class"
            isEditable={isEditable}
          />
        ) : null}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    position: "relative",
    overflow: "hidden",
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
    position: "absolute",
    right: 14,
    top: 10,
    width: 24,
    height: 24,
    border: "none",
    backgroundColor: "red",
    ["::after"]: {
      content: "v",
    },
  },

  collapsedContainer: {
    height: 62,
  },
});
