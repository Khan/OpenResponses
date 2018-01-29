// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
// import { RadioGroup, Radio } from "react-radio-group";

import sharedStyles from "../styles.js";

type Props = {
  data: number,
  dataKey: string,
  leftLabel: string,
  numberOfChoices: number,
  onChange: (newValue: number) => void,
  editable: boolean,
  rightLabel: string,
};

type State = {
  groupID: number,
};

let nextLikertChoiceGroupID = 0;

export default class LikertChoice extends React.Component {
  props: Props;
  state: State;

  static defaultProps = {
    data: null,
    numberOfChoices: 4,
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
    return; // TODO FIX
    /*
    return (
      <form>
        <RadioGroup
          name={`likertGroup${this.state.groupID}`}
          onChange={this.onChange}
          selectedValue={this.props.data}
          className={css(styles.radioGroup)}
        >
          {[...Array(this.props.numberOfChoices).keys()].map(index =>
            <label key={index} className={css(styles.choice)}>
              {index === 0
                ? <span className={css(styles.leftLabel)}>
                    {this.props.leftLabel}
                  </span>
                : null}
              <Radio value={index} disabled={!this.props.editable} />
              {index === this.props.numberOfChoices - 1
                ? <span className={css(styles.rightLabel)}>
                    {this.props.rightLabel}
                  </span>
                : null}
            </label>,
          )}
        </RadioGroup>
      </form>
    );*/
  }
}

const styles = StyleSheet.create({
  radioGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  choice: {
    ...sharedStyles.typography.bodySmall,
    ":not(:first-child)": {
      marginLeft: 15,
    },
  },

  leftLabel: {
    display: "inline-block",
    marginRight: 20,
  },

  rightLabel: {
    display: "inline-block",
    marginLeft: 20,
  },
});
