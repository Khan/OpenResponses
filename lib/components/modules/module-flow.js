// @flow
import { default as KeyPather } from "keypather";
import Link from "next/link";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import { Raw, Plain } from "slate";

import Button from "../button";
import sharedStyles from "../../styles";

const keypather = new KeyPather();

const validateData = data => {
  if (typeof data === "undefined") {
    return false;
  } else if (typeof data === "object" && data.kind === "rich-editor") {
    // TODO(andy): extract this to rich-editor or a helper module; duplicative.
    return (
      Plain.serialize(
        Raw.deserialize(JSON.parse(data.rawData), { terse: true }),
      ).length > 0
    );
  } else if (typeof data === "object" && data.kind === "scratchpad") {
    // TODO(andy): extract this to scratchpad-canvas or a helper module; duplicative.
    return data.totalInkLength > 50;
  } else {
    return true;
  }
};

export default class ModuleFlow extends React.Component {
  state = {
    activeDrawingStatus: false,
  };

  onPageChange = newPage => {
    this.props.onPageChange(newPage);
  };

  render = () => {
    const getUserInput = index => this.props.data[index] || {};
    const getRemoteData = key => this.props.remoteData[key] || {};
    const children = this.props.children(
      getUserInput,
      getRemoteData,
      this.props.dispatcher,
    );
    const moduleIndex = this.props.moduleIndex;
    const currentModuleElement = children[moduleIndex];
    const currentModuleData = getUserInput(moduleIndex);
    const dataMappedElement = React.cloneElement(currentModuleElement, {
      ...currentModuleElement.props,
      activeDrawingStatus: this.state.activeDrawingStatus,
      editable:
        this.props.ready &&
        this.props.moduleIndex >= this.props.furthestPageLoaded,
      data: currentModuleData,
      query: this.props.query,
      onActiveDrawingStatusChange: activeDrawingStatus =>
        this.setState({ activeDrawingStatus }),
      key: moduleIndex,
      onChange: newData => this.props.onChange(moduleIndex, newData),
    });

    const dataMappedChildren =
      dataMappedElement && Array.isArray(dataMappedElement.props.children)
        ? dataMappedElement.props.children
        : [dataMappedElement.props.children];
    const currentModuleValidated =
      dataMappedChildren &&
      dataMappedChildren
        .map(
          child =>
            child &&
            (!child.props ||
              !child.props.dataKey ||
              validateData(
                keypather.get(currentModuleData, child.props.dataKey),
              )),
        )
        .every(x => x) &&
      !dataMappedElement.props.blockNextButton;

    return (
      <div>
        {dataMappedElement}
        <div className={css(styles.bottomBar)}>
          <div className={css(styles.rightSide)}>
            <div className={css(styles.rightSideInterior)}>
              {
                <Button
                  width={148}
                  onClick={e => this.onPageChange(this.props.moduleIndex + 1)}
                  disabled={
                    !currentModuleValidated ||
                    moduleIndex >= this.props.maximumPageNumber ||
                    moduleIndex === children.length - 1
                  }
                >
                  Next
                </Button>
              }
              {[...Array(children.length).keys()].map((dummy, i) => {
                const pageNumber = children.length - i - 1;
                const isSelected = pageNumber === moduleIndex;
                const isCompleted = pageNumber < this.props.furthestPageLoaded;
                const isLastPage = pageNumber === children.length - 1;
                return (
                  <Button
                    key={pageNumber}
                    width={35}
                    style={[
                      styles.page,
                      isLastPage ? styles.lastPage : undefined,
                      isCompleted ? styles.completedPage : undefined,
                      isSelected ? styles.selectedPage : undefined,
                    ]}
                    hoverStyle={[
                      styles.page,
                      isLastPage ? styles.lastPage : undefined,
                      isCompleted ? styles.completedPage : undefined,
                      isSelected ? styles.selectedPage : undefined,
                      styles.hoverPage,
                    ]}
                    pressStyle={[
                      styles.page,
                      isLastPage ? styles.lastPage : undefined,

                      isCompleted ? styles.completedPage : undefined,
                      styles.selectedPage,
                    ]}
                    onClick={e => this.onPageChange(pageNumber)}
                    disabled={pageNumber > this.props.furthestPageLoaded}
                  >
                    {pageNumber + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
}

const styles = StyleSheet.create({
  page: {
    color: sharedStyles.colors.gray68,
    backgroundColor: "transparent",
    borderColor: sharedStyles.colors.gray68,
    borderRadius: 17.5,
    borderWidth: 2,
    height: 35,
    marginRight: 12,
    padding: "7px 0px",
    width: 35,

    ":hover": {
      color: sharedStyles.colors.gray68,
      backgroundColor: "transparent",
      borderColor: sharedStyles.colors.gray68,
    },
  },

  lastPage: {
    marginRight: 16,
  },

  selectedPage: {
    borderColor: sharedStyles.colors.gray25,
    color: sharedStyles.colors.gray25,
    ":hover": {
      borderColor: sharedStyles.colors.gray25,
      color: sharedStyles.colors.gray25,
    },
  },

  hoverPage: {
    borderColor: sharedStyles.colors.gray41,
    color: sharedStyles.colors.gray41,

    ":hover": {
      borderColor: sharedStyles.colors.gray41,
      color: sharedStyles.colors.gray41,
    },
  },

  completedPage: {
    borderColor: "transparent",
    backgroundColor: sharedStyles.colors["open-responses"].domain1,
    color: sharedStyles.colors.white,
    ":hover": {
      borderColor: "transparent",
      backgroundColor: sharedStyles.colors["open-responses"].domain1,
      color: sharedStyles.colors.white,
    },
  },

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
    alignItems: "center",
    paddingRight: 32,
    /*
    TODO fix layout of button for two-up prompt
    margin: "0 auto",
    maxWidth: 507
    */
  },
});
