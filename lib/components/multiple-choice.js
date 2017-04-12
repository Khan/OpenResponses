// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import { RadioGroup, Radio } from "react-radio-group";

import sharedStyles from "../styles.js";

type Props = {
  choices: string[],
  data: ?number,
  onChange: (newValue: number) => void
};

type State = {
  groupID: number
};

let nextMultipleChoiceGroupID = 0;

export default class MultipleChoice extends React.Component {
  props: Props;
  state: State;

  static defaultProps = {
    data: null
  };

  constructor(props: Props) {
    super(props);
    this.state = { groupID: nextMultipleChoiceGroupID };
    nextMultipleChoiceGroupID += 1;
  }

  onChange = (newValue: number) => {
    this.props.onChange(newValue);
  };

  render() {
    return (
      <form>
        <RadioGroup
          name={`radioGroup${this.state.groupID}`}
          onChange={this.onChange}
          selectedValue={this.props.data}
        >
          {this.props.choices.map((choice, index) => (
            <label key={index} className={css(styles.choice)}>
              <Radio value={index} />
              {choice}
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
    display: "block"
  }
});
