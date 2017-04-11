import Heading from "../lib/components/heading.js";
import Paragraph from "../lib/components/paragraph.js";
import RichEditor from "../lib/components/rich-editor.js";
import sharedStyles from "../lib/styles.js";

export default () => (
  <div>
    <Heading text="Testing 1, 2, 3!" />
    <Paragraph text="What _what_ **what**" />
    <RichEditor />
    <RichEditor />
    <RichEditor />
  </div>
);
