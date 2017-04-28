// @flow
import React from "react";

import ScratchpadRenderer from "./scratchpad-renderer";
import { smoothedStrokeFromTouchStroke } from "./scratchpad-inking";

const getDuration = strokes => {
  if (strokes.length > 0) {
    const { samples } = strokes[strokes.length - 1];
    return samples.length > 0 ? samples[samples.length - 1].t : 0;
  } else {
    return 0;
  }
};

const maxPauseTime = 500;
const pauseAtEndTime = 2000;
const playbackRate = 2.0;

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
};

export default class ScratchpadPlayer extends React.Component {
  static defaultProps: {
    data: {},
  };

  state: State = {
    baseTimestamp: null,
    playbackStrokes: [],
    currentSmoothedStrokes: [],
  };

  componentWillReceiveProps = nextProps => {
    if (nextProps.data) {
      // TODO(andy): Extract/share this serialization stuff with Scratchpad.
      this.setState({
        playbackStrokes: normalizeStrokesForPlayback(
          JSON.parse(nextProps.data.strokes),
        ),
      });
    }
  };

  advanceAnimation = (timestamp: number) => {
    window.requestAnimationFrame(this.advanceAnimation);
    if (this.state.playbackStrokes.length === 0) {
      return;
    }

    const { baseTimestamp } = this.state;
    if (baseTimestamp) {
      const duration = getDuration(this.state.playbackStrokes) + pauseAtEndTime;
      const dt = (timestamp - baseTimestamp) * playbackRate % duration;
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
      this.setState({ currentSmoothedStrokes: smoothedStrokes });
    } else {
      this.setState({ baseTimestamp: timestamp });
    }
  };

  componentDidMount = () => {
    this.advanceAnimation(performance.now());
  };

  render = () => (
    <ScratchpadRenderer
      width={this.props.width}
      height={this.props.height}
      strokes={this.state.currentSmoothedStrokes}
    />
  );
}
