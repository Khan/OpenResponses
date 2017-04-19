// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";

import sharedStyles from "../../styles.js";

export default class ModuleFlow extends React.Component {
  onNextPage = () => {
    this.props.onPageChange(this.props.moduleIndex + 1);
  };

  render = () => {
    const getUserInput = index => this.props.data[index] || {};
    const getRemoteData = key => this.props.remoteData[key] || {};
    const children = this.props.children(getUserInput, getRemoteData);
    const moduleIndex = this.props.moduleIndex;
    const currentModuleElement = children[moduleIndex];
    const dataMappedElement = React.cloneElement(currentModuleElement, {
      ...currentModuleElement.props,
      ready: this.props.ready,
      data: getUserInput(moduleIndex),
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
