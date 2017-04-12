import Heading from "../lib/components/heading.js";
import MultipleChoice from "../lib/components/multiple-choice.js";
import Paragraph from "../lib/components/paragraph.js";
import RichEditor from "../lib/components/rich-editor.js";
import sharedStyles from "../lib/styles.js";

export default () => (
  <div>
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
  </div>
);
