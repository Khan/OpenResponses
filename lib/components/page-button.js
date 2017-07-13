// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";

import Button from "./button";
import sharedStyles from "../styles";

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
});

const PageButton = (props: {
  isLastPage: boolean,
  isSelected: boolean,
  isCompleted: boolean,
  disabled: boolean,
  onClick: () => void,
  children: React.Children,
}) =>
  <Button
    width={35}
    style={[
      styles.page,
      props.isLastPage ? styles.lastPage : undefined,
      props.isCompleted ? styles.completedPage : undefined,
      props.isSelected ? styles.selectedPage : undefined,
    ]}
    hoverStyle={[
      styles.page,
      props.isLastPage ? styles.lastPage : undefined,
      props.isCompleted ? styles.completedPage : undefined,
      props.isSelected ? styles.selectedPage : undefined,
      styles.hoverPage,
    ]}
    pressStyle={[
      styles.page,
      props.isLastPage ? styles.lastPage : undefined,
      props.isCompleted ? styles.completedPage : undefined,
      styles.selectedPage,
    ]}
    onClick={props.onClick}
    disabled={props.disabled}
  >
    {props.children}
  </Button>;

export default PageButton;
