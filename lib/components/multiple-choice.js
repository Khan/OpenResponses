// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import { RadioGroup, Radio } from "react-radio-group";

import sharedStyles from "../styles.js";

type Props = {
  choices: string[]
};

type State = {
  groupID: number,
  selectedChoice: ?number
};

let nextMultipleChoiceGroupID = 0;

export default class MultipleChoice extends React.Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedChoice: null,
      groupID: nextMultipleChoiceGroupID
    };
    nextMultipleChoiceGroupID += 1;
  }

  onChange = (newValue: number) => {
    this.setState({ selectedChoice: newValue });
  };

  render() {
    return (
      <form>
        <RadioGroup
          name={`radioGroup${this.state.groupID}`}
          onChange={this.onChange}
          selectedValue={this.state.selectedChoice}
        >
          {this.props.choices.map((choice, index) => (
            <label className={css(styles.choice)}>
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
