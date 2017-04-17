import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

export default getData => [
  <BasePrompt>
    <Heading>I am a second test.</Heading>
    <Paragraph>
      Aliquip do officia proident voluptate tempor nulla. Officia quis ea ad consectetur tempor tempor commodo ad duis labore ut. Minim ipsum fugiat proident et eu culpa. Laborum magna excepteur esse exercitation laboris consequat commodo non sit mollit. Proident ea consectetur laboris exercitation enim anim mollit magna cupidatat voluptate ex aute est. Proident do enim consectetur cillum laborum ullamco do pariatur labore laborum pariatur non cupidatat do. Cupidatat nulla excepteur magna occaecat in.
    </Paragraph>
    <RichEditor dataKey="response" />
  </BasePrompt>,
  <BasePrompt>
    <Heading>I am a second test (page 2).</Heading>
    <Paragraph>
      Laborum nostrud exercitation cupidatat Lorem dolore consequat veniam ullamco consequat. Commodo eiusmod officia pariatur fugiat ullamco exercitation laboris dolor dolor nisi commodo excepteur. Veniam mollit laborum exercitation proident nulla nostrud tempor ullamco adipisicing amet nisi do.
    </Paragraph>
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
