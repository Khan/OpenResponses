// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import { RadioGroup, Radio } from "react-radio-group";

import sharedStyles from "../styles.js";

type Props = {
  data: number,
  dataKey: string,
  leftLabel: string,
  numberOfChoices: number,
  onChange: (newValue: number) => void,
  rightLabel: string
};

type State = {
  groupID: number
};

let nextLikertChoiceGroupID = 0;

export default class LikertChoice extends React.Component {
  props: Props;
  state: State;

  static defaultProps = {
    data: null,
    numberOfChoices: 4
  };

  constructor(props: Props) {
    super(props);
    this.state = { groupID: nextLikertChoiceGroupID };
    nextLikertChoiceGroupID += 1;
  }

  onChange = (newValue: number) => {
    this.props.onChange(newValue);
  };

  render() {
    return (
      <form>
        <RadioGroup
          name={`likertGroup${this.state.groupID}`}
          onChange={this.onChange}
          selectedValue={this.props.data}
        >
          {[...Array(this.props.numberOfChoices).keys()].map(index => (
            <label key={index} className={css(styles.choice)}>
              {index === 0 ? this.props.leftLabel : null}
              <Radio value={index} />
              {index === this.props.numberOfChoices - 1
                ? this.props.rightLabel
                : null}
            </label>
          ))}
        </RadioGroup>
      </form>
    );
  }
}

const styles = StyleSheet.create({
  choice: {
    ...sharedStyles.typography.bodyLarge,
    ":not(:first-child)": {
      marginLeft: 15
    }
  }
});
