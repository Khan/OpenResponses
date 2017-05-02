import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase } from "../db";
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
const modules = (getUserInput, getRemoteData) => [
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
  getUserInput(0).interpretation === 0
    ? <TwoUpPrompt referenceComponent={humanitiesPassage}>
        <Heading>
          1. This student agreed that Mark Nathan Cohen’s interpretation that the advent of agriculture was a negative development in human history’s interpretation was more defensible. They found this interpretation more plausible because:
        </Heading>
        <Paragraph>
          {getRemoteData("otherStudentResponse")}
        </Paragraph>
        <Heading>
          2. Did they have the same reasons for arriving at that conclusion as you provided?
        </Heading>
        <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
        {getUserInput(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : getUserInput(1).otherIsSame === 0
              ? <Heading>Summarize their reasoning</Heading>
              : <Heading>Why not?</Heading>}
        {getUserInput(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : <RichEditor dataKey="explanation" />}
      </TwoUpPrompt>
    : <TwoUpPrompt referenceComponent={humanitiesPassage}>
        <Heading>
          1. This student disagreed that Mark Nathan Cohen’s interpretation was more defensible. They found the Kevin Reilly’s interpretation more plausible because:
        </Heading>
        <Paragraph>
          {getRemoteData("otherStudentResponse")}
        </Paragraph>
        <Heading>
          2. Did they focus on the same evidence as you did?
        </Heading>
        <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
        {getUserInput(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : getUserInput(1).otherIsSame === 0
              ? <Heading>
                  Since you had the same evidence, why do you think you came to different conclusions?
                </Heading>
              : <Heading>
                  a. Do you think the evidence they chose is relevant? b. Does the evidence they chose support the interpretation they chose&gt;?
                </Heading>}
        {getUserInput(1).otherIsSame === undefined
          ? null /* Hide this part of the question until they choose an answer above. */
          : <RichEditor dataKey="explanation" />}
      </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={humanitiesPassage}>
    <Heading>
      1. Here is your original chosen interpretation and reasoning:
    </Heading>
    <Paragraph>
      {firstScreenChoices[getUserInput(0).interpretation]}
    </Paragraph>
    <Paragraph>
      {getUserInput(0).interpretationExplanation}
    </Paragraph>
    <Heading>
      2. Would you change your reasoning?
    </Heading>
    <MultipleChoice dataKey="choice" choices={["Yes", "No"]} />
    {getUserInput(2).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : getUserInput(2).choice === 0
          ? <Heading>
              TODO this copy not yet designed
            </Heading>
          : <Heading>
              TODO this copy not yet designed
            </Heading>}
    {getUserInput(2).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : <RichEditor dataKey="explanation" />}
  </TwoUpPrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["[0].interpretation"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async ([interpretation], userID, cohort) => {
      if (interpretation === undefined) {
        return undefined;
      } else {
        const alternativeInterpretation = interpretation ? 1 : 0;
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesA/${cohort}`)
          .orderByChild("0/interpretation")
          .equalTo(alternativeInterpretation)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {}).map(
          userID => otherResponsesByUserID[userID],
        );
        // Filter out other students without real explanations.
        const responsesWithInterpretationExplanations = otherResponses.filter(
          response => {
            return response[0].interpretationExplanation;
          },
        );
        if (responsesWithInterpretationExplanations.length > 0) {
          // TODO(andy): Right now, we just take the first. We will need to design something more sophisticated here... once we figure out what we want!
          const chosenResponse = responsesWithInterpretationExplanations[0];
          return chosenResponse[0].interpretationExplanation;
        } else {
          // TODO(andy): We must decide what we want to do in this case. Probably display a curated response.
          return Raw.serialize(
            Plain.deserialize("There is no other student response."),
            { terse: true },
          );
        }
      }
    },
  },
};

export default { modules, remoteDataRequirements };
