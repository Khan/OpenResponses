// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Avatar from "./avatar";
import Button from "./button";
import QuillEditor from "./quill-rich-editor";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

type Props = {
  posts: {
    data: any, // TODO

    studentName: string,
    avatar: string,
  }[],

  onChange: number => void,

  onSetIsExpanded: boolean => void,
  isExpanded: boolean,
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
        <Avatar avatar={post.avatar} />
        <div className={css(styles.contents)}>
          <p className={css(styles.studentName)}>{post.studentName}</p>
          <QuillEditor
            placeholder="Write your response here…"
            minHeight="3em"
            data={post.data}
            onChange={this.props.onChange}
            editable={isEditable}
          />
          <Button>Share with class</Button>
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 14,
    paddingTop: 10,
    display: "flex",
    position: "relative",
    overflow: "hidden",
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
    height: 40,
  },
});
