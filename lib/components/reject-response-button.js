import { StyleSheet, css } from "aphrodite";

import Button from "./button";
import sharedStyles from "../styles";

const RejectResponseButton = props => {
  if (!props.dispatcher) {
    return null;
  }
  return (
    <Button
      style={styles.button}
      onClick={() => {
        props.dispatcher("rejectResponse", {
          revieweeIndex: props.revieweeIndex,
        });
      }}
    >
      Request different response
    </Button>
  );
};

export default RejectResponseButton;

const buttonStyles = {
  display: "block",
  height: "unset",
  margin: "0",
  marginLeft: "auto",
  backgroundColor: "unset",
  border: "none",
  color: sharedStyles.colors.gray68,
  ...sharedStyles.typography.labelSmall,
  fontWeight: "normal",
  fontSize: 13, // TODO: this is an irregular type style. verify or regularize.
  padding: 0,
};
buttonStyles[":hover"] = { ...buttonStyles };

const styles = StyleSheet.create({
  button: buttonStyles,
});
