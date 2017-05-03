import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const referencePassage = (
  <div>
    <Heading>Read the following two passages:</Heading>
    <Paragraph>
      “The world’s most primitive people have few possessions, but they are not poor. Poverty is not a certain small amount of goods, nor is it just a relation between means and ends; above all it is a relation between people. Poverty is a social status. As such it is the invention of civilization. It has grown with civilization, at once as an invidious [or unjust] distinction between classes and more importantly as a tributary relation that can render agrarian peasants more susceptible to natural catastrophes than any winter camp of Alaskan Eskimo [hunter-gatherers].”
    </Paragraph>
    <Paragraph>
      —Marshall Sahlins, “The Original Affluent Society,” Stone Age Economics (Hawthorn, NY: Aldine de Gruyter, 1972).
    </Paragraph>
    <Paragraph>
      “How do you show that the lives of people 10,000 years ago got better when they abandoned hunting and gathering for farming? Are twentieth century hunter-gatherers really worse off than farmers? Scattered throughout the world, several dozen groups of so-called primitive people, like the Kalahari Bushmen, continue to support themselves that way. It turns out that these people have plenty of leisure time, sleep a good deal, and work less hard than their farming neighbors. For instance, the average time devoted each week to obtaining food is only 12 to 19 hours for one group of Bushmen, 14 hours or less for the Hadza nomads of Tanzania. One Bushman, when asked why he hadn’t emulated neighboring tribes by adopting agriculture, replied, “Why should we, when there are so many mongongo nuts in the world?”
    </Paragraph>
    <Paragraph>
      While farmers concentrate on high-carbohydrate crops like rice and potatoes, the mix of wild plants and animals in the diets of surviving hunter-gatherers provides more protein and a better balance of other nutrients. In one study, the Bushmen’s average daily food intake (during a month when food was plentiful) was 2,140 calories and 93 grams of protein. This is considerably greater than the recommended daily allowance for people of their size. It’s almost impossible to imagine that Bushmen, who eat 75 or so wild plants, could die of starvation the way hundreds of thousands of Irish farmers and their families did during the potato famine of the 1840s.”
    </Paragraph>
    <Paragraph>
      —Jared Diamond, “The Worst Mistake in the History of the Human Race,” Discover magazine (May 1987) 64–66.
    </Paragraph>
  </div>
);

// I've extracted these strings because they're used in the middle screens depending on the student's choice in the first screen.
const interpretations = [
  "Marshall Sahlins' interpretation was more defensible",
  "Jared Diamond's interpretation was more defensible",
  "both interpretations were equally defensible",
];

const modules = (getUserInput, getRemoteData) => [
  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. The first interpretation focuses on:
    </Heading>
    <MultipleChoice
      dataKey="firstFocus"
      choices={["environment", "religion", "state-building"]}
    />
    <Heading>
      2. The second interpretation focuses on:
    </Heading>
    <MultipleChoice
      dataKey="secondFocus"
      choices={["environment", "religion", "state-building"]}
    />
    <Heading>
      3. Which of the following reflects your understanding:
    </Heading>
    <MultipleChoice
      dataKey="interpretationChoice"
      choices={[
        "The first interpretation by Marshall Sahlins is more defensible",
        "The second interpretation by Jared Diamond is more defensible",
        "Both interpretations are equally defensible",
      ]}
    />
    <Heading>
      4. Explain your reasoning.
    </Heading>
    <RichEditor dataKey="interpretationExplanation" />
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. This student agreed that
      {" "}
      {interpretations[getUserInput(0).interpretationChoice]}
      . They found this interpretation more plausible because:
    </Heading>
    <Paragraph>
      {getRemoteData("agreeingStudentResponse")}
    </Paragraph>
    <Heading>
      2. Did they have the same reasons for arriving at that conclusion as you provided?
    </Heading>
    <MultipleChoice dataKey="sameReasons" choices={["Yes", "No"]} />
    {getUserInput(1).sameReasons === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : getUserInput(1).sameReasons === 0
          ? <Heading>Summarize their reasoning</Heading>
          : <Heading>Why not?</Heading>}
    {getUserInput(1).sameReasons === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : <RichEditor dataKey="explanation" />}
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. This student disagreed that
      {" "}
      {interpretations[getUserInput(0).interpretationChoice]}
      . They found that
      {" "}
      {interpretations[getRemoteData("disagreeingStudentResponse").choice]}
      {" "}
      because:
    </Heading>
    <Paragraph>
      {getRemoteData("disagreeingStudentResponse").explanation}
    </Paragraph>
    <Heading>
      2. Did they focus on the same evidence as you did?
    </Heading>
    <MultipleChoice dataKey="sameEvidence" choices={["Yes", "No"]} />
    {getUserInput(2).sameEvidence === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : getUserInput(2).sameEvidence === 0
          ? <Heading>
              Since you had the same evidence, why do you think you came to different conclusions?
            </Heading>
          : <Heading>
              a. Do you think that the evidence they chose is relevant? b. Does the evidence they chose support the interpretation they chose?
            </Heading>}
    {getUserInput(2).sameEvidence === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : <RichEditor dataKey="explanation" />}
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. Here is your original chosen interpretation and reasoning:
    </Heading>
    <Paragraph>
      {interpretations[getUserInput(0).interpretationChoice]}
    </Paragraph>
    <Paragraph>
      {getUserInput(0).interpretationExplanation}
    </Paragraph>
    <Heading>
      2. Would you change your reasoning?
    </Heading>
    <MultipleChoice dataKey="choice" choices={["Yes", "No"]} />
    {getUserInput(3).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : getUserInput(3).choice === 0
          ? <Heading>
              TODO this copy not yet designed
            </Heading>
          : <Heading>
              TODO this copy not yet designed
            </Heading>}
    {getUserInput(3).choice === undefined
      ? null /* Hide this part of the question until they choose an answer above. */
      : <RichEditor dataKey="explanation" />}
  </TwoUpPrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  agreeingStudentResponse: {
    // Our choice of other student response depends on this student's choice of interpretation:
    inputs: ["[0].interpretationChoice"],
    // Given the student's choice, find another student who agrees.
    fetcher: async ([interpretationChoice], userID) => {
      if (interpretationChoice === undefined) {
        return undefined;
      } else {
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesB/${cohort}/inputs`)
          .orderByChild("0/interpretationChoice")
          .equalTo(interpretationChoice)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {})
          // Don't show the student their own work.
          .filter(otherResponseUserID => userID !== otherResponseUserID)
          .map(userID => otherResponsesByUserID[userID])
          // Filter out other students without real explanations.
          .filter(response => {
            return response[0].interpretationExplanation;
          });
        if (otherResponses.length > 0) {
          // TODO(andy): Right now, we just take the first. We will need to design something more sophisticated here... once we figure out what we want!
          const chosenResponse = otherResponses[0];
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

  // TODO(andy): Fix duplication here.
  disagreeingStudentResponse: {
    // Our choice of other student response depends on this student's choice of interpretation:
    inputs: ["[0].interpretationChoice"],
    // Given the student's choice, find another student who agrees.
    fetcher: async ([interpretationChoice], userID, cohort) => {
      if (interpretationChoice === undefined) {
        return undefined;
      } else {
        // Here's a tricky thing: Firebase doesn't offer a NOT filter. We can only find entries which *match* a particular parameter. Some options:
        // 1. Fetch them all and filter client-side.
        // 2. Pick a random different interpretation choice to filter by.
        // 3. Pick a deterministic other interpretation choice to filter by (always incrementing by 1).
        // We'll roll with #2 for now, but it's kind of uncomfortable.
        const otherInterpretationChoice = (interpretationChoice +
          (Math.random() > 0.5 ? 1 : 2)) %
          3;
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesB/${cohort}/inputs`)
          .orderByChild("0/interpretationChoice")
          .equalTo(otherInterpretationChoice)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {})
          .map(userID => otherResponsesByUserID[userID])
          // Filter out other students without real explanations.
          .filter(response => {
            return response[0].interpretationExplanation;
          });
        if (otherResponses.length > 0) {
          // TODO(andy): Right now, we just take the first. We will need to design something more sophisticated here... once we figure out what we want!
          const chosenResponse = otherResponses[0];
          return {
            choice: chosenResponse[0].interpretationChoice,
            explanation: chosenResponse[0].interpretationExplanation,
          };
        } else {
          // TODO(andy): We must decide what we want to do in this case. Probably display a curated response.
          return {
            choice: 2,
            explanation: Raw.serialize(
              Plain.deserialize("There is no other student response."),
              { terse: true },
            ),
          };
        }
      }
    },
  },
};

export default { modules, remoteDataRequirements };
