// @flow
import Measure from "react-measure";
import React from "react";
import { css, StyleSheet } from "aphrodite/no-important";

import ScratchpadRenderer from "./scratchpad-renderer";
import sharedStyles from "../styles.js";
import { smoothedStrokeFromTouchStroke } from "./scratchpad-inking";

const getDuration = strokes => {
  if (strokes.length > 0) {
    const {
      samples,
    } = strokes[strokes.length - 1];
    return samples.length > 0 ? samples[samples.length - 1].t : 0;
  } else {
    return 0;
  }
};

const maxPauseTime = 500;
const pauseAtEndTime = 4000;
const playbackRate = 7.0;

// TODO(andy): This is a hack, constant shared with scratchpad.js. Gotta extract+share some bits here.
const canvasPadding = 24;

const normalizeStrokesForPlayback = strokes => {
  if (strokes.length > 0 && strokes[0].samples.length > 0) {
    const baseTime = strokes[0].samples[0].t;
    return strokes.reduce(
      (accumulatedStrokes, stroke, strokeIndex) => {
        const lastStrokeOutputEndTime = accumulatedStrokes.length > 0
          ? accumulatedStrokes[accumulatedStrokes.length - 1].samples[
              accumulatedStrokes[accumulatedStrokes.length - 1].samples.length -
                1
            ].t
          : 0;
        const samples = stroke.samples.reduce(
          (accumulatedSamples, sample, sampleIndex) => {
            const lastSampleOutputTime = accumulatedSamples.length > 0
              ? accumulatedSamples[accumulatedSamples.length - 1].t
              : lastStrokeOutputEndTime;
            const lastSampleTime = sampleIndex > 0
              ? stroke.samples[sampleIndex - 1].t
              : strokeIndex > 0
                  ? strokes[strokeIndex - 1].samples[
                      strokes[strokeIndex - 1].samples.length - 1
                    ].t
                  : baseTime;
            const sampleT = lastSampleOutputTime + (sample.t - lastSampleTime);
            const effectiveT = sampleT >= lastSampleOutputTime
              ? Math.min(sampleT, lastSampleOutputTime + maxPauseTime)
              : lastSampleOutputTime + maxPauseTime;
            return [
              ...accumulatedSamples,
              {
                ...sample,
                t: effectiveT,
              },
            ];
          },
          [],
        );
        return [
          ...accumulatedStrokes,
          {
            ...stroke,
            samples,
          },
        ];
      },
      [],
    );
  }
};

type State = {
  baseTimestamp: ?number,
  // TODO(andy) real stroke types
  playbackStrokes: any[],
  currentSmoothedStrokes: any[],
  dimensions: {
    width: number,
    height: number,
  },
};

export default class ScratchpadPlayer extends React.Component {
  static defaultProps: {
    data: {},
  };

  state: State;

  constructor(props) {
    super(props);
    this.state = {
      baseTimestamp: null,
      currentSmoothedStrokes: [],
      dimensions: {
        width: -1,
        height: -1,
      },
      playbackStrokes: this.getPlaybackStrokesFromProps(props),
    };
  }

  componentWillReceiveProps = nextProps => {
    const playbackStrokes = this.getPlaybackStrokesFromProps(nextProps);
    let smoothedStrokes = undefined;
    if (!nextProps.playing) {
      smoothedStrokes = playbackStrokes.map(stroke =>
        smoothedStrokeFromTouchStroke(stroke));
    }
    this.setState({
      playbackStrokes: playbackStrokes,
      currentSmoothedStrokes: smoothedStrokes,
    });
  };

  getPlaybackStrokesFromProps = props =>
  // TODO(andy): Extract/share this serialization stuff with Scratchpad.
    (props.data &&
      normalizeStrokesForPlayback(JSON.parse(props.data.strokes))) || [];

  advanceAnimation = (timestamp: number) => {
    this.animationRequest = window.requestAnimationFrame(this.advanceAnimation);

    // TODO(andy): Don't actually spin the animation frame when not playing.
    if (this.state.playbackStrokes.length === 0 || !this.props.playing) {
      return;
    }

    const {
      baseTimestamp,
    } = this.state;
    if (baseTimestamp) {
      const duration = getDuration(this.state.playbackStrokes);
      const dt = (timestamp - baseTimestamp) *
        playbackRate %
        (duration + pauseAtEndTime * playbackRate);
      let maxStrokeIndex = 0;
      let maxSampleIndex = 0;
      for (
        let strokeIndex = 0;
        strokeIndex < this.state.playbackStrokes.length;
        strokeIndex++
      ) {
        const samples = this.state.playbackStrokes[strokeIndex].samples;
        for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
          const sample = samples[sampleIndex];
          if (sample.t < dt) {
            maxStrokeIndex = strokeIndex;
            maxSampleIndex = sampleIndex;
          } else {
            break;
          }
        }
      }

      let slicedStrokes = this.state.playbackStrokes.slice(
        0,
        maxStrokeIndex + 1,
      );
      const lastStroke = slicedStrokes[slicedStrokes.length - 1];
      slicedStrokes[slicedStrokes.length - 1] = {
        ...lastStroke,
        samples: lastStroke.samples.slice(0, maxSampleIndex + 1),
      };
      // TODO(andy): This is probably too slow.
      const smoothedStrokes = slicedStrokes.map(stroke =>
        smoothedStrokeFromTouchStroke(stroke));
      this.setState({
        currentSmoothedStrokes: smoothedStrokes,
      });
    } else {
      this.setState({
        baseTimestamp: timestamp,
      });
    }
  };

  componentDidMount = () => {
    this.animationRequest = window.requestAnimationFrame(this.advanceAnimation);
  };

  componentWillUnmount = () => {
    window.cancelAnimationFrame(this.animationRequest);
  };

  render = () => (
    <div
      className={css(styles.canvasAndChildrenContainer)}
      style={{
        width: this.props.width - canvasPadding * 2 || "auto",
        height: this.props.height - canvasPadding * 2 || "auto",
        marginLeft: -(this.props.paddingLeft ||
          this.props.paddingHorizontal ||
          0),
        marginRight: -(this.props.paddingRight ||
          this.props.paddingHorizontal ||
          0),
        paddingBottom: this.props.paddingBottom || 0,
      }}
    >
      <Measure
        onMeasure={dimensions => {
          this.setState({
            dimensions,
          });
        }}
      >
        <div className={css(styles.canvasContainer)}>
          <ScratchpadRenderer
            width={this.props.width || this.state.dimensions.width}
            height={this.props.height || this.state.dimensions.height}
            strokes={this.state.currentSmoothedStrokes}
          />
        </div>
      </Measure>
      {this.props.children}
      {this.props.query.dotGrid
        ? <div className={css(styles.dotGrid)} />
        : null}
    </div>
  );
}

// TODO(andy): Tons of stuff here duplicated from scratchpad.js
const styles = StyleSheet.create({
  canvasAndChildrenContainer: {
    borderRadius: sharedStyles.borderRadius,
    border: "2px solid #f0f8f9",
    padding: canvasPadding,
    position: "relative",
  },

  canvasContainer: {
    position: "absolute",
    overflow: "hidden",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  toolbarContainer: {
    position: "absolute",
    bottom: 0,
    left: -36,
  },

  dotGrid: {
    position: "absolute",
    top: 24, // TODO(andy): DRY
    bottom: 24,
    left: 24,
    right: 24,
    backgroundImage: "url('static/dotgrid.png')",
    backgroundSize: 15,
    pointerEvents: "none",
  },
});
