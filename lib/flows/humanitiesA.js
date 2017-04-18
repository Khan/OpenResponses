import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import humanitiesPassage from "./components/humanitiesPassage";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

// I've extracted these so that I can display the same text on the first and third screens.
const firstScreenChoices = [
  "Mark Nathan Cohen’s interpretation that the advent of agriculture was a negative development in human history",
  "Kevin Reilly’s interpretation that the advent of agriculture was a positive development in human history",
];

// TODO: implement colored highlight spans
export default getData => [
  <TwoUpPrompt referenceComponent={humanitiesPassage}>
    <Heading>
      1. In the first passage, select the sentence which shows the main idea in orange.
    </Heading>
    <Heading>
      2. In the second passage, select the sentence which shows the main idea in blue.
    </Heading>
    <Heading>
      3. Select the intepretation you think is more defensible:
    </Heading>
    <MultipleChoice dataKey="interpretation" choices={firstScreenChoices} />
    <Heading>
      4. Explain why the interpretation you chose is more plausible. Highlight the relevant evidence in purple and explain why it supports the interpretation.
    </Heading>
    <RichEditor dataKey="interpretationExplanation" />
  </TwoUpPrompt>,

  // Second screen depends on agreeing with Mark Cohen vs. Kevin Reilly.
  getData(0).interpretation === 0
    ? <TwoUpPrompt referenceComponent={humanitiesPassage}>
        <Heading>
          1. This student agreed that Mark Nathan Cohen’s interpretation that the advent of agriculture was a negative development in human history’s interpretation was more defensible. They found this interpretation more plausible because:
        </Heading>
        <Paragraph>
          OTHER STUDENT RESPONSE HERE Nostrud eiusmod qui consequat pariatur ut voluptate officia dolor nisi ullamco qui ex tempor ullamco. Incididunt velit cillum in nostrud quis nulla. Magna Lorem adipisicing enim aliqua dolore fugiat elit qui consectetur. Ad magna veniam nulla id minim mollit occaecat cupidatat elit dolor voluptate reprehenderit.
        </Paragraph>
        <Heading>
          2. Did they have the same reasons for arriving at that conclusion as you provided?
        </Heading>
        <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
        {getData(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : getData(1).otherIsSame === 0
              ? <Heading>Summarize their reasoning</Heading>
              : <Heading>Why not?</Heading>}
        {getData(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : <RichEditor dataKey="explanation" />}
      </TwoUpPrompt>
    : <TwoUpPrompt referenceComponent={humanitiesPassage}>
        <Heading>
          1. This student disagreed that Mark Nathan Cohen’s interpretation was more defensible. They found the Kevin Reilly’s interpretation more plausible because:
        </Heading>
        <Paragraph>
          OTHER STUDENT RESPONSE HERE Nostrud eiusmod qui consequat pariatur ut voluptate officia dolor nisi ullamco qui ex tempor ullamco. Incididunt velit cillum in nostrud quis nulla. Magna Lorem adipisicing enim aliqua dolore fugiat elit qui consectetur. Ad magna veniam nulla id minim mollit occaecat cupidatat elit dolor voluptate reprehenderit.
        </Paragraph>
        <Heading>
          2. Did they focus on the same evidence as you did?
        </Heading>
        <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
        {getData(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : getData(1).otherIsSame === 0
              ? <Heading>
                  Since you had the same evidence, why do you think you came to different conclusions?
                </Heading>
              : <Heading>
                  a. Do you think the evidence they chose is relevant? b. Does the evidence they chose support the interpretation they chose&gt;?
                </Heading>}
        {getData(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : <RichEditor dataKey="explanation" />}
      </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={humanitiesPassage}>
    <Heading>
      1. Here is your original chosen interpretation and reasoning:
    </Heading>
    <Paragraph>
      {firstScreenChoices[getData(0).interpretation]}
    </Paragraph>
    <Paragraph>
      {getData(0).interpretationExplanation}
    </Paragraph>
    <Heading>
      2. Would you change your reasoning?
    </Heading>
    <MultipleChoice dataKey="choice" choices={["Yes", "No"]} />
    {getData(2).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : getData(2).choice === 0
          ? <Heading>
              TODO this copy not yet designed
            </Heading>
          : <Heading>
              TODO this copy not yet designed
            </Heading>}
    {getData(2).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : <RichEditor dataKey="explanation" />}
  </TwoUpPrompt>,
];
