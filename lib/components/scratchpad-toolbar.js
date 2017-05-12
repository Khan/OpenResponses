import React from "react";
import { css, StyleSheet } from "aphrodite";

import Button from "./button";
import sharedStyles from "../styles";

const colorToEscapedAphroditeColorName = color => color.replace("#", "");

const ColorButton = props => (
  <Button
    onClick={props.onClick}
    style={buttonStyles[colorToEscapedAphroditeColorName(props.color)]}
    /* TODO(andy): The hover style on these buttons is broken. */
    pressStyle={buttonStyles[colorToEscapedAphroditeColorName(props.color)]}
  />
);

const toolbarColors = [
  sharedStyles.colors["economics-finance-domain"].domain2,
  sharedStyles.colors.math.domain1,
  "black",
  // sharedStyles.colors.science.domain1,
  // sharedStyles.colors.humanities.domain1,
  // sharedStyles.colors["partner-content"].domain1,
  // sharedStyles.colors["test-prep"].domain1,
  // sharedStyles.colors.computing.domain2,
];

const ScratchpadToolbar = props => (
  <div className={css(styles.toolbar)}>
    {toolbarColors.map(color => (
      <ColorButton
        key={color}
        color={color}
        onClick={() => props.onChange({ color: color, tool: "pen" })}
      />
    ))}
    <Button
      style={buttonStyles.eraser}
      onClick={() => props.onChange({ tool: "eraser" })}
    >
      ⌦
    </Button>
    <Button style={buttonStyles.undo} onClick={() => props.onUndo()}>
      ⎌
    </Button>

  </div>
);

const styles = StyleSheet.create({
  toolbar: {
    display: "flex",
    flexDirection: "column",
  },
});

const createButtonStyle = color => {
  return {
    backgroundColor: color,
    width: 24,
    height: 24,
    padding: 0,
    borderRadius: 12,
    border: "none",

    ":not(:last-child)": {
      marginBottom: 12,
    },
  };
};

const buttonStyles = StyleSheet.create(
  toolbarColors.reduce(
    (result, color) => {
      result[colorToEscapedAphroditeColorName(color)] = createButtonStyle(
        color,
      );
      return result;
    },
    {
      eraser: createButtonStyle(sharedStyles.colors.gray68),
      undo: createButtonStyle(sharedStyles.colors.gray68),
    },
  ),
);

export default ScratchpadToolbar;
