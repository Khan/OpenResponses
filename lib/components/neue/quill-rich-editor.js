import { StyleSheet, css } from "aphrodite";
import dynamic from "next/dynamic";
import React, { Fragment } from "react";

import sharedStyles from "../../styles.js";

const ReactQuill = dynamic(import("../../../vendor/react-quill.min.js"), {
  loading: () => null,
  ssr: false,
});

import "../../../vendor/quill.core.css";

export const dataKind = "quill-editor-1";

export default class QuillRichEditor extends React.Component {
  static defaultProps = {
    data: {
      kind: dataKind,
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      editorState: this.getEditorStateFromProps(props),
      isFocused: false,
    };
  }

  getEditorStateFromProps = props => {
    if (props.data.kind !== dataKind) {
      throw `Unexpected data kind in ${effectiveProps.data}`;
    }

    return props.data.rawData || props.initialString || "";
  };

  componentWillReceiveProps = nextProps => {
    if (
      nextProps.data &&
      nextProps.data.rawData &&
      !this.state.isFocused &&
      this.state.editorState !== nextProps.data.rawData
    ) {
      this.setState({ editorState: this.getEditorStateFromProps(nextProps) });
    }
  };

  isReadOnly = () => !this.props.editable || this.props.quotedWork;

  onChange = newEditorState => {
    const oldState = this.state.editorState;
    this.setState({ editorState: newEditorState });
    if (newEditorState !== oldState && !this.isReadOnly()) {
      this.props.onChange({
        kind: dataKind,
        rawData: newEditorState,
      });
    }
  };

  onFocus = () => this.setState({ isFocused: true });
  onBlur = () => this.setState({ isFocused: false });

  render() {
    return (
      <Fragment>
        <ReactQuill
          value={this.state.editorState}
          onChange={this.onChange}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          placeholder={
            this.props.inManagerInterface ? undefined : this.props.placeholder
          }
          readOnly={this.isReadOnly()}
          modules={{ toolbar: false }}
          formats={["bold", "italic", "underline"]}
        />

        <style global jsx>{`
          .ql-container {
            font-family: ${sharedStyles.wbTypography.body.fontFamily};
            font-size: ${sharedStyles.wbTypography.body.fontSize}px;
            line-height: ${sharedStyles.wbTypography.body.lineHeight};
          }

          .ql-editor {
            padding: 0;
            line-height: unset;
            min-height: ${this.props.minHeight || "4em"};
          }

          .ql-editor.ql-blank::before {
            left: 0;
            font-style: unset;
            color: ${sharedStyles.wbColors.offBlack50};
          }
        `}</style>
      </Fragment>
    );
  }
}
