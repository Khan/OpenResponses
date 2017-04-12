// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";

import sharedStyles from "../../styles.js";

export default class ModuleFlow extends React.Component {
  state = {
    currentPage: 0,
  };

  onNextPage = () => {
    // TODO: pushState
    this.setState({ currentPage: this.state.currentPage + 1 });
  };

  render = () => {
    return (
      <div>
        {React.Children.toArray(this.props.children)[this.state.currentPage]}
        <div className={css(styles.bottomBar)}>
          <button className={css(styles.nextButton)} onClick={this.onNextPage}>
            Next Page
          </button>
        </div>
      </div>
    );
  };
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: sharedStyles.colors.gray98,
    bottom: 0,
    display: "flex",
    flexDirection: "row",
    height: 44,
    position: "absolute",
    width: "100%",
  },

  nextButton: {
    marginLeft: "auto",
    flex: "0 0 auto",
  },
});
