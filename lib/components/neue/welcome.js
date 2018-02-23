import React from "react";
import { StyleSheet, css } from "aphrodite";
import validator from "validator";

import Avatar from "./avatar";
import Button from "./button";
import mediaQueries from "../../media-queries";
import sharedStyles from "../../styles";

const possibleNames = [
  "Baklava",
  "Bomboloni",
  "Bran Muffin",
  "Buñuelo",
  "Canelé",
  "Cheerios",
  "Cheese Danish",
  "Cherry Pie",
  "Cinnamon Roll",
  "Croissant",
  "Cronut",
  "Cruller",
  "Doughnut",
  "Éclair",
  "Gulab Jamun",
  "Kouign-Amann",
  "Mille-Feuille",
  "Morning Bun",
  "Pain au Chocolat",
  "Pastel de Nata",
  "Pop Tart",
  "Profiterole",
  "Raspberry Danish",
  "Rugelach",
  "Shortcake",
  "Stollen",
  "Strudel",
  "Toaster Strudel",
  "Wheaties",
];

const avatars = [
  "aqualine-sapling",
  "duskpin-sapling",
  "leafers-sapling",
  "marcimus-red",
  "mr-pants",
  "mr-pink-blue",
  "piceratops-sapling",
  "primosaur-sapling",
  "purple-pi",
  "starky-sapling",
];

export default class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
    };
  }

  componentDidMount = () => {
    this.onShuffle();
  };

  onChangeEmail = event => {
    this.setState({ email: event.target.value });
  };

  onSubmit = () => {
    this.props.onSubmit &&
      this.props.onSubmit(this.state.email, this.state.name, this.state.avatar);
  };

  onShuffle = () => {
    this.setState({
      name:
        possibleNames[
          Math.floor(Math.random(possibleNames.length) * possibleNames.length)
        ],
      avatar: avatars[Math.floor(Math.random(avatars.length) * avatars.length)],
    });
  };

  render = () => {
    const emailIsValid = validator.isEmail(this.state.email);

    return (
      <div className={css(styles.container)}>
        <h2 className={css(styles.title)}>{this.props.title}</h2>
        <p className={css(styles.paragraph)}>
          In this activity, you’ll do the following:
        </p>
        <p className={css(styles.paragraph, styles.step)}>
          1. Write a response to an open-ended prompt.
        </p>
        <p className={css(styles.paragraph, styles.step)}>
          2. See and give feedback to your classmates’ work.
        </p>
        <p className={css(styles.paragraph, styles.step)}>
          3. Reflect on what you’ve learned from the activity.
        </p>
        <div className={css(styles.formRow)}>
          <p className={css(styles.label)} style={{ marginTop: 36 }}>
            Your email address:
          </p>
          <input
            type="text"
            placeholder="you@emailhost.com"
            className={css(styles.input)}
            onChange={this.onChangeEmail}
            onKeyDown={event => {
              if (event.keyCode === 13 && emailIsValid) {
                this.onSubmit();
              }
            }}
            value={this.state.email}
          />
        </div>
        <div className={css(styles.formRow)}>
          <p className={css(styles.label)} style={{ marginTop: 24 }}>
            Your secret identity:
          </p>
          <p className={css(styles.secretIdentity)}>
            <Avatar avatar={this.state.avatar} />
            <span className={css(styles.identityName)}>{this.state.name}</span>
            <Button type="SECONDARY" onClick={this.onShuffle}>
              Shuffle
            </Button>
          </p>
        </div>
        {this.props.collectEmail ? (
          <Button
            style={styles.button}
            disabled={!emailIsValid}
            onClick={this.onSubmit}
          >
            {emailIsValid
              ? "Get started"
              : "Please enter a valid email address"}
          </Button>
        ) : (
          <Button style={styles.button} onClick={this.onSubmit}>
            Get started
          </Button>
        )}
      </div>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    margin: 0,
    padding: 14,
    backgroundColor: sharedStyles.wbColors.white,
    [mediaQueries.lgOrLarger]: {
      padding: 24,
      borderRadius: sharedStyles.borderRadius,
      // ...sharedStyles.hairlineBorderStyle,
    },
  },

  title: {
    ...sharedStyles.wbTypography.headingLarge,
    marginTop: 0,
  },

  paragraph: {
    ...sharedStyles.wbTypography.body,
    [":last-child"]: {
      marginBottom: 0,
    },
  },

  input: {
    width: "100%",
    padding: 12,
    ...sharedStyles.wbTypography.labelMedium,
    borderRadius: sharedStyles.borderRadius,
    ...sharedStyles.hairlineBorderStyle,
    boxSizing: "border-box",

    ":focus": {
      outline: "none",
      borderColor: sharedStyles.wbColors.productBlue,
      borderWidth: 1,
      boxShadow: "inset 0px 1px 3px rgba(0, 0, 0, 0.25)",
      padding: 11.5,
    },
  },

  button: {
    marginTop: 12,
    width: "100%",
  },

  flowImageContainer: {
    width: 768,
    position: "relative",
    left: "-125px", // TODO(andy): hack hack
  },

  step: {
    display: "flex",
    alignItems: "center",
  },

  formRow: {
    [mediaQueries.lgOrLarger]: {
      display: "flex",
      alignItems: "center",
    },
  },

  label: {
    ...sharedStyles.wbTypography.labelLarge,
    [mediaQueries.lgOrLarger]: {
      width: 150,
      textAlign: "right",
      margin: 0,
      marginRight: 24,
      flexShrink: 0,
    },
  },

  secretIdentity: {
    ...sharedStyles.wbTypography.body,
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },

  identityName: {
    flexGrow: 1,
    marginRight: 12,
    ...sharedStyles.wbTypography.body,
  },
});
