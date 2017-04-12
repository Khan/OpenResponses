import BasePrompt from "../lib/components/modules/base-prompt.js";
import Heading from "../lib/components/heading.js";
import LikertChoice from "../lib/components/likert-choice.js";
import MultipleChoice from "../lib/components/multiple-choice.js";
import Paragraph from "../lib/components/paragraph.js";
import RichEditor from "../lib/components/rich-editor.js";
import sharedStyles from "../lib/styles.js";

// TODO(andy): Next up, keep moving the data management outwards.
export default class SimpleInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: {} };
  }

  onChange = newData => {
    this.setState({ data: newData });
  };

  render() {
    return (
      <BasePrompt data={this.state.data} onChange={this.onChange}>
        <Heading text="Testing 1, 2, 3!" />
        <Paragraph text="What _what_ $x^2 + 30 = 100$" />
        <MultipleChoice
          choices={[
            "This is a choice",
            "And this is another choice",
            "But this is actually a bee"
          ]}
        />
        <RichEditor />
        <LikertChoice leftLabel="not dog" rightLabel="very dog" />
      </BasePrompt>
    );
  }
}
