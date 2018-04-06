// @flow
import Lightbox from "react-image-lightbox";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Markdown from "./markdown";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

export type Stimulus =
  | {
      imageURL: string,
    }
  | {
      text: Markdown,
      source: Markdown,
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
        <div className={css(styles.innerStimuliContainer)}>
          {this.props.stimuli.map((stimulus, idx) => {
            if (stimulus.text) {
              return (
                <div
                  className={css(
                    styles.stimulusPassage,
                    this.props.forceSmallStimuli
                      ? styles.forceSmallStimulus
                      : undefined,
                  )}
                  key={idx}
                >
                  <div style={{ marginBottom: 14 }}>
                    <Markdown content={`**Source**: ${stimulus.source}`} />
                  </div>
                  <Markdown content={stimulus.text} />
                </div>
              );
            } else {
              return (
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
              );
            }
          })}
        </div>
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
    overflow: "scroll",
  },

  innerStimuliContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginRight: 14,
    paddingLeft: 14,
    float: "left" /* hack to get the right margin to appear bluh */,
  },

  stimulusThumbnail: {
    borderRadius: sharedStyles.borderRadius,
    cursor: "zoom-in",
    marginTop: 0,
    marginBottom: 0,
    marginRight: 14,
    objectFit: "contain",
    maxWidth: 700,
    maxHeight: 600,
    [mediaQueries.mdOrSmaller]: {
      maxWidth: "85vw",
      // maxHeight: 250,
    },
  },

  stimulusPassage: {
    ...sharedStyles.hairlineBorderStyle,
    borderRadius: sharedStyles.borderRadius,
    backgroundColor: "white",
    width: 600,
    marginRight: 14,
    padding: 14,
    flexShrink: 0,
    [mediaQueries.mdOrSmaller]: {
      width: "85vw",
    },
    boxSizing: "border-box",
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
