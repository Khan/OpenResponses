// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";

import sharedStyles from "../../styles.js";

// TODO(andy): Extract flow and cohort constants.

export default class ModuleFlow extends React.Component {
  state = {
    currentPage: 0,
  };

  onNextPage = () => {
    // TODO: pushState
    this.setState({ currentPage: this.state.currentPage + 1 });
  };

  render = () => {
    const getData = index => this.props.data[index] || {};
    const children = this.props.children(getData);
    const moduleIndex = this.state.currentPage;
    const currentModuleElement = children[moduleIndex];
    const dataMappedElement = React.cloneElement(currentModuleElement, {
      ...currentModuleElement.props,
      ready: this.props.ready,
      data: getData(moduleIndex),
      onChange: newData => this.props.onChange(moduleIndex, newData),
    });
    return (
      <div>
        {dataMappedElement}
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
