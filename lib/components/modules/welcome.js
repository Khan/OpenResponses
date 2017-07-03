import React from "react";
import { StyleSheet, css } from "aphrodite";
import validator from "validator";

import BasePrompt from "./base-prompt";
import Button from "../button";
import Heading from "../heading";
import Paragraph from "../paragraph";
import sharedStyles from "../../styles";

export default class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
    };
  }

  onChangeEmail = event => {
    this.setState({ email: event.target.value });
  };

  onSubmit = () => {
    this.props.onSubmit && this.props.onSubmit(this.state.email);
  };

  render = () => {
    const emailIsValid = validator.isEmail(this.state.email);

    return (
      <BasePrompt>
        <Heading>Welcome!</Heading>
        <Paragraph>
          In this activity, you'll trade work with other students, improving
          your work together.
        </Paragraph>
        <Paragraph>
          Please enter an **email address** so that we can let you know when
          another student has left you feedback.
        </Paragraph>
        <input
          type="text"
          placeholder="you@emailhost.com"
          className={css(styles.input)}
          onChange={this.onChangeEmail}
          value={this.state.email}
        />
        <Button
          style={styles.button}
          disabled={!emailIsValid}
          onClick={this.onSubmit}
        >
          {emailIsValid ? "Get started" : "Please enter a valid email address"}
        </Button>
      </BasePrompt>
    );
  };
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 12,
    ...sharedStyles.typography.bodySmall,
    borderRadius: sharedStyles.borderRadius,
    ...sharedStyles.hairlineBorderStyle,
    boxSizing: "border-box",

    ":focus": {
      outline: "none",
      borderColor: sharedStyles.colors["open-responses"].domain1,
      borderWidth: 1,
      boxShadow: "inset 0px 1px 3px rgba(0, 0, 0, 0.25)",
      padding: 11.5,
    },
  },

  button: {
    marginTop: 24,
    width: "100%",
  },
});
