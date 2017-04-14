import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

export default getData => [
  <BasePrompt>
    <Heading text="I am a second test." />
    <Paragraph
      text="In aute aliqua incididunt adipisicing mollit ipsum eiusmod et. Laborum minim officia aliqua eiusmod qui reprehenderit sit exercitation culpa aliquip dolor Lorem exercitation. Dolor et laboris quis amet sit elit. Duis minim labore ut in nostrud sunt ad elit nostrud sit reprehenderit veniam laborum labore. Ut voluptate aliquip exercitation duis excepteur dolore sint aliquip minim sunt magna excepteur. Occaecat id culpa ullamco non sit pariatur do nisi nostrud incididunt nostrud excepteur."
    />
    <RichEditor dataKey="response" />
  </BasePrompt>,
  <BasePrompt>
    <Heading text="I am a second test (page 2)." />
    <Paragraph
      text="In aute aliqua incididunt adipisicing mollit ipsum eiusmod et. Laborum minim officia aliqua eiusmod qui reprehenderit sit exercitation culpa aliquip dolor Lorem exercitation. Dolor et laboris quis amet sit elit. Duis minim labore ut in nostrud sunt ad elit nostrud sit reprehenderit veniam laborum labore. Ut voluptate aliquip exercitation duis excepteur dolore sint aliquip minim sunt magna excepteur. Occaecat id culpa ullamco non sit pariatur do nisi nostrud incididunt nostrud excepteur."
    />
    <MultipleChoice
      dataKey="choice"
      choices={[
        "This is a choice",
        "And this is another choice",
        "But this is actually a bee",
      ]}
    />
  </BasePrompt>,
];
