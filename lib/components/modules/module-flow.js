// @flow
import Link from "next/link";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import { Raw, Plain } from "slate";

import Button from "../domain-button";
import sharedStyles from "../../styles";

const validateData = data => {
  if (typeof data === "undefined") {
    return false;
  } else if (typeof data === "object" && data.kind === "rich-editor") {
    // TODO(andy): extract this to rich-editor or a helper module; duplicative.
    return Plain.serialize(
      Raw.deserialize(JSON.parse(data.rawData), { terse: true }),
    ).length > 0;
  } else if (typeof data === "object" && data.kind === "scratchpad") {
    // TODO(andy): extract this to scratchpad-canvas or a helper module; duplicative.
    return data.totalInkLength > 50;
  } else {
    return true;
  }
};

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
    const currentModuleData = getUserInput(moduleIndex);
    const dataMappedElement = React.cloneElement(currentModuleElement, {
      ...currentModuleElement.props,
      editable: this.props.ready &&
        this.props.moduleIndex >= this.props.furthestPageLoaded,
      data: currentModuleData,
      query: this.props.query,
      onChange: newData => this.props.onChange(moduleIndex, newData),
    });

    const dataMappedChildren = dataMappedElement &&
      Array.isArray(dataMappedElement.props.children)
      ? dataMappedElement.props.children
      : [dataMappedElement.props.children];
    const currentModuleValidated = dataMappedChildren &&
      dataMappedChildren
        .map(
          child =>
            child &&
            (!child.props ||
              !child.props.dataKey ||
              validateData(currentModuleData[child.props.dataKey])),
        )
        .every(x => x);

    return (
      <div>
        {dataMappedElement}
        <div className={css(styles.bottomBar)}>
          <div className={css(styles.rightSide)}>
            <div className={css(styles.rightSideInterior)}>
              {moduleIndex < children.length - 1
                ? <Button
                    width={148}
                    domain="humanities"
                    onClick={this.onNextPage}
                    disabled={
                      !currentModuleValidated ||
                        moduleIndex >= this.props.maximumPageNumber
                    }
                  >
                    Next
                  </Button>
                : null}
            </div>
          </div>
        </div>
      </div>
    );
  };
}

const styles = StyleSheet.create({
  bottomBar: {
    alignItems: "center",
    backgroundColor: sharedStyles.colors.gray98,
    boxShadow: "0 1px 4px 0 #6a6a6a",
    bottom: 0,
    display: "flex",
    flexDirection: "row",
    height: 70,
    position: "fixed",
    width: "100%",
  },

  rightSide: {
    marginLeft: "50%",
    width: "50%",
  },

  rightSideInterior: {
    display: "flex",
    flexDirection: "row-reverse",
    width: "100%",
    margin: "0 auto",
    maxWidth: 507 /* TODO remove special shared knowledge with BasePrompt */,
  },
});
