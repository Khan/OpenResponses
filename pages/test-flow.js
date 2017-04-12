import BasePrompt from "../lib/components/modules/base-prompt";
import Heading from "../lib/components/heading";
import LikertChoice from "../lib/components/likert-choice";
import ModuleFlow from "../lib/components/modules/module-flow";
import MultipleChoice from "../lib/components/multiple-choice";
import Paragraph from "../lib/components/paragraph";
import RichEditor from "../lib/components/rich-editor";
import TwoUpPrompt from "../lib/components/modules/two-up-prompt";
import sharedStyles from "../lib/styles";

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
      <ModuleFlow>
        <TwoUpPrompt
          data={this.state.data}
          onChange={this.onChange}
          referenceComponent={
            <div>
              <p>
                Fugiat sunt elit elit minim adipisicing. Laborum qui nulla elit cupidatat ea enim exercitation elit duis incididunt elit minim. Esse cillum esse id fugiat ullamco exercitation proident fugiat magna excepteur. Fugiat proident aliqua aliquip ea voluptate in qui fugiat nostrud eiusmod nulla enim. Incididunt voluptate pariatur duis mollit ipsum. Velit irure cillum dolore laborum ullamco adipisicing ut ea eu dolor ullamco culpa. Commodo fugiat labore proident sunt id fugiat consectetur aute eiusmod officia minim.
              </p>
              <p>
                Fugiat sunt elit elit minim adipisicing. Laborum qui nulla elit cupidatat ea enim exercitation elit duis incididunt elit minim. Esse cillum esse id fugiat ullamco exercitation proident fugiat magna excepteur. Fugiat proident aliqua aliquip ea voluptate in qui fugiat nostrud eiusmod nulla enim. Incididunt voluptate pariatur duis mollit ipsum. Velit irure cillum dolore laborum ullamco adipisicing ut ea eu dolor ullamco culpa. Commodo fugiat labore proident sunt id fugiat consectetur aute eiusmod officia minim.
              </p>
              <p>
                Fugiat sunt elit elit minim adipisicing. Laborum qui nulla elit cupidatat ea enim exercitation elit duis incididunt elit minim. Esse cillum esse id fugiat ullamco exercitation proident fugiat magna excepteur. Fugiat proident aliqua aliquip ea voluptate in qui fugiat nostrud eiusmod nulla enim. Incididunt voluptate pariatur duis mollit ipsum. Velit irure cillum dolore laborum ullamco adipisicing ut ea eu dolor ullamco culpa. Commodo fugiat labore proident sunt id fugiat consectetur aute eiusmod officia minim.
              </p>
              <p>
                Fugiat sunt elit elit minim adipisicing. Laborum qui nulla elit cupidatat ea enim exercitation elit duis incididunt elit minim. Esse cillum esse id fugiat ullamco exercitation proident fugiat magna excepteur. Fugiat proident aliqua aliquip ea voluptate in qui fugiat nostrud eiusmod nulla enim. Incididunt voluptate pariatur duis mollit ipsum. Velit irure cillum dolore laborum ullamco adipisicing ut ea eu dolor ullamco culpa. Commodo fugiat labore proident sunt id fugiat consectetur aute eiusmod officia minim.
              </p>
            </div>
          }
        >
          <Heading text="Testing 1, 2, 3!" />
          <Paragraph text="What _what_ $x^2 + 30 = 100$" />
          <LikertChoice leftLabel="not dog" rightLabel="very dog" />
        </TwoUpPrompt>

        <BasePrompt data={this.state.data} onChange={this.onChange}>
          <Heading text="Testing 1, 2, 3--the second!" />
          <Paragraph text="This is a second prompt $x^2$" />
          <MultipleChoice
            choices={[
              "This is a choice",
              "And this is another choice",
              "But this is actually a bee"
            ]}
          />
          <RichEditor />
        </BasePrompt>
      </ModuleFlow>
    );
  }
}
