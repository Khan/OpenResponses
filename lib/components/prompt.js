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
  forceSmallStimuli?: boolean,
};

type State = {
  openStimulus: boolean,
};

export default class Prompt extends React.Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      openStimulus: null,
    };
  }

  render = () => {
    const stimuli = this.props.stimuli && (
      <div className={css(styles.stimuli)}>
        {this.props.stimuli.map((stimulus, idx) => (
          <img
            key={idx}
            src={stimulus.imageURL}
            onClick={() => this.setState({ openStimulus: idx })}
            className={css(
              styles.stimulusThumbnail,
              this.props.forceSmallStimuli
                ? styles.forceSmallStimulus
                : undefined,
            )}
          />
        ))}
      </div>
    );
    return (
      <div
        className={css(
          styles.container,
          this.props.forceSmallStimuli ? styles.smallContainer : undefined,
        )}
      >
        <h2 className={css(styles.title)}>{this.props.title}</h2>
        <div className={css(styles.promptBody)}>
          <Markdown content={this.props.prompt} />
        </div>
        {stimuli}
        {this.props.postStimuliPrompt ? (
          <div className={css(styles.postStimuliPrompt)}>
            <Markdown content={this.props.postStimuliPrompt} />
          </div>
        ) : null}
        {this.state.openStimulus !== null && (
          <Lightbox
            mainSrc={this.props.stimuli[this.state.openStimulus].imageURL}
            prevSrc={
              this.props.stimuli.length > 1
                ? this.props.stimuli[
                    (this.state.openStimulus + this.props.stimuli.length - 1) %
                      this.props.stimuli.length
                  ].imageURL
                : undefined
            }
            nextSrc={
              this.props.stimuli.length > 1
                ? this.props.stimuli[
                    (this.state.openStimulus + 1) % this.props.stimuli.length
                  ].imageURL
                : undefined
            }
            onCloseRequest={() => this.setState({ openStimulus: null })}
            onMovePrevRequest={() =>
              this.setState({
                openStimulus:
                  (this.state.openStimulus + this.props.stimuli.length - 1) %
                  this.props.stimuli.length,
              })}
            onMoveNextRequest={() =>
              this.setState({
                openStimulus:
                  (this.state.openStimulus + 1) % this.props.stimuli.length,
              })}
            enableZoom={true}
          />
        )}
      </div>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 0,
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
    paddingTop: 14,
    paddingBottom: 14,
    marginLeft: -14,
    marginRight: -14,
    backgroundColor: sharedStyles.wbColors.offWhite,
    display: "flex",
    overflow: "scroll",
    justifyContent: "space-between",
  },

  stimulusThumbnail: {
    borderRadius: 4,
    cursor: "zoom-in",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 14,
    marginRight: 14,
    objectFit: "contain",
    maxWidth: 700,
    maxHeight: 600,
    [mediaQueries.mdOrSmaller]: {
      maxWidth: "90%",
      maxHeight: 250,
    },
  },

  forceSmallStimulus: {
    maxWidth: "90%",
    maxHeight: 250,
  },

  promptBody: {
    paddingBottom: 14,
  },

  postStimuliPrompt: {
    marginTop: 14,
  },

  smallContainer: {
    maxHeight: 600,
    overflow: "scroll",
  },
});
