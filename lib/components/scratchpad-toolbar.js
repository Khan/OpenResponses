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
    <Button style={buttonStyles.undo} onClick={() => props.onUndo()}>
      <img
        src="/static/scratchpad-undo@2x.png"
        style={{ width: 24, height: 24 }}
      />
    </Button>

    <Button
      style={buttonStyles.eraser}
      onClick={() => props.onChange({ tool: "eraser" })}
    >
      <img
        src="/static/scratchpad-eraser@2x.png"
        style={{ width: 24, height: 24 }}
      />
    </Button>

    {toolbarColors.map(color => (
      <ColorButton
        key={color}
        color={color}
        onClick={() => props.onChange({ color: color, tool: "pen" })}
      />
    ))}
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

const iconButtonStyle = {
  ...createButtonStyle(sharedStyles.colors.white),
  display: "flex",
  justifyContent: "center",
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
      eraser: iconButtonStyle,
      undo: iconButtonStyle,
    },
  ),
);

export default ScratchpadToolbar;
