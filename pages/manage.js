// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import { signIn } from "../lib/auth";
import { copyFallbackUsers } from "../lib/db";
import sharedStyles from "../lib/styles";

// TODO(andy): For now, no security around this whatsoever. If we deploy this in public, we'll want to change that.
export default class ManagePage extends React.Component {
  getFlowID = () => this.props.url.query.flowID;
  getClassCode = () => this.props.url.query.classCode;

  onClickPopulateFallbackUsers = () => {
    const sourceClassCode = window.prompt(
      "Enter the class code from which the fallback users should be copied:",
    );

    copyFallbackUsers(
      this.getFlowID(),
      sourceClassCode,
      this.props.url.query.classCode,
    );
  };

  render = () => {
    return (
      <div className={css(styles.container)}>
        <p>
          <button onClick={this.onClickPopulateFallbackUsers}>
            Populate this class code with fallback users
          </button>
        </p>
      </div>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
});
