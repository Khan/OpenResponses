import React from "react";
import { css, StyleSheet } from "aphrodite";

import sharedStyles from "../styles.js";

export default class NumericInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
    };
  }

  onFocus = () => this.setState({ isFocused: true });
  onBlur = () => this.setState({ isFocused: false });
  onChange = event => {
    this.props.onChange(event.target.value);
  };

  render = () =>
    <input
      type="text"
      value={
        this.props.data === null || typeof this.props.data === "undefined"
          ? ""
          : this.props.data
      }
      onChange={this.onChange}
      onFocus={this.onFocus}
      onBlur={this.onBlur}
      disabled={!this.props.editable}
      className={css(
        styles.numeric,
        sharedStyles.editorStyles.base,
        this.props.editable
          ? sharedStyles.editorStyles.editable
          : sharedStyles.editorStyles.uneditable,
        this.state.isFocused ? sharedStyles.editorStyles.focused : null,
      )}
    />;
}

const styles = StyleSheet.create({
  numeric: {
    width: 100,
  },
});
