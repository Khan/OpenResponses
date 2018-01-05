// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";

import sharedStyles from "../styles.js";

type Props = {
  choices: string[],
  data: number,
  dataKey: string,
  editable: boolean,
  onChange: (newValue: number) => void,
};

export default class SelectAllThatApply extends React.Component {
  props: Props;
  state: State;

  static defaultProps = {
    data: [],
  };

  static skipsValidation = true;

  onChange = (index: number, isChecked: boolean) => {
    const selectionSet = new Set(this.props.data);
    if (this.props.choices.length > 1) {
      if (isChecked) {
        selectionSet.add(index);
      } else {
        selectionSet.delete(index);
      }
      this.props.onChange(Array.from(selectionSet));
    } else {
      this.props.onChange(isChecked);
    }
  };

  render() {
    const isChecked = index => {
      if (this.props.choices.length > 1) {
        const selectionSet = new Set(this.props.data);
        return selectionSet.has(index);
      } else {
        return this.props.data;
      }
    };
    return (
      <div className={css(styles.choiceContainer)}>
        {this.props.choices.map((choice, index) => (
          <label key={index} className={css(styles.choice)}>
            <input
              type="checkbox"
              value={index}
              disabled={!this.props.editable}
              className={css(styles.checkBox)}
              checked={isChecked(index)}
              onChange={event => this.onChange(index, event.target.checked)}
            />
            {choice}
          </label>
        ))}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  choice: {
    ...sharedStyles.typography.bodySmall,
    display: "block",
  },

  choiceContainer: {
    marginBottom: 18,
  },

  checkBox: {
    marginRight: 12,
    fontSize: "inherit",
    verticalAlign: "middle",
  },
});
