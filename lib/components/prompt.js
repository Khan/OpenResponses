// @flow
import Lightbox from "react-image-lightbox";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Markdown from "./markdown";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

export type Stimulus = {
  imageURL: string,
};

type Props = {
  title: string,
  prompt: Markdown,
  stimuli: ?(Stimulus[]),
  postStimuliPrompt: ?Markdown,
};

type State = {
  stimulusIsOpen: boolean,
};

export default class Prompt extends React.Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      stimulusIsOpen: false,
    };
  }

  render = () => {
    const stimuli = this.props.stimuli && (
      <div className={css(styles.stimuli)}>
        {this.props.stimuli.map((stimulus, idx) => (
          <img
            key={idx}
            src={stimulus.imageURL}
            onClick={() => this.setState({ stimulusIsOpen: true })}
            className={css(styles.stimulusThumbnail)}
          />
        ))}
      </div>
    );
    return (
      <div className={css(styles.container)}>
        <h2 className={css(styles.title)}>{this.props.title}</h2>
        <Markdown content={this.props.prompt} />
        {stimuli}
        {this.props.postStimuliPrompt ? (
          <Markdown content={this.props.postStimuliPrompt} />
        ) : null}
        {this.state.stimulusIsOpen && (
          <Lightbox
            mainSrc={this.props.stimuli[0].imageURL}
            onCloseRequest={() => this.setState({ stimulusIsOpen: false })}
            enableZoom={false}
          />
        )}
      </div>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: "white",
    [mediaQueries.lgOrLarger]: {
      borderRadius: sharedStyles.borderRadius,
      ...sharedStyles.hairlineBorderStyle,
    },
  },

  title: {
    ...sharedStyles.wbTypography.headingLarge,
    marginTop: 0,
  },

  stimuli: {
    marginTop: 14,
    marginBottom: 14,
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },

  stimulusThumbnail: {
    borderRadius: 4,
    cursor: "zoom-in",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 14,
    marginRight: 14,
    maxHeight: 200,
    [mediaQueries.lgOrLarger]: {
      maxHeight: 600,
    },
  },
});
