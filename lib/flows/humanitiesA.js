import Plain from "slate-plain-serializer";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const humanitiesPassage = (
  <div>
    <Heading>Read the following two passages:</Heading>
    <Paragraph>
      “There is evidence that primitive populations suffer relatively low rates
      of many diseases compared to the more affluent modern societies. Primitive
      populations appear to enjoy several nutritional advantages over our
      affluent modern societies that protect them from many of the diseases that
      now afflict us. These include high bulk diets, diets with relatively few
      calories in proportion to other nutrients, diets low in total fat (and
      particularly low in saturated fat), and diets high in potassium and low in
      sodium. These advantages are common to such groups and appear to help
      protect them against a series of conditions that plague the more affluent
      of modern populations. Diabetes appears to be extremely rare in primitive
      groups (both hunter-gatherers and farmers) as are circulatory problems,
      including high blood pressure, heart disease, and strokes. Similarly,
      disorders associated with poor bowel function, such as appendicitis,
      hemorrhoids, and bowel cancers are extremely rare. Rates of many other
      types of cancer — particularly breast and lung — appear to be low in most
      small-scale societies. This is true even when corrected for the small
      proportion of the elderly often observed. Even those cancers that we now
      consider to be diseases of underdevelopment may be the historical product
      of changes in human behavior involving food storage or the human-assisted
      spread of infections. The record of the skeletons suggests that cancers
      were comparatively rare in prehistory.”
    </Paragraph>
    <Paragraph>
      —Mark Nathan Cohen, Health and the Rise of Civilization (New Haven, CT:
      Yale UP, 1989) 138.
    </Paragraph>
    <Paragraph>
      “The most obvious achievements of the first civilizations are the
      monuments — the pyramids, temples, palaces, statues, and treasures — that
      were created for the new ruling class of kings, nobles, priests, and their
      officials. But civilized life is much more than the capacity to create
      monuments.
    </Paragraph>
    <Paragraph>
      Civilized life is secure life. At the most basic level this means security
      from the sudden destruction that village communities might suffer.
      Civilized life gives the feeling of permanence. It offers regularity,
      stability, order, even routine. Plans can be made. Expectations can be
      realized. People can be expected to act predictably, according to the
      rules.
    </Paragraph>
    <Paragraph>
      The first cities were able to attain stability with walls that shielded
      the inhabitants from nomads and armies, with the first codes of law that
      defined human relationships, with police and officials that enforced the
      laws, and with institutions that functioned beyond the lives of their
      particular members. City life offered considerably more permanence and
      security than village life.”
    </Paragraph>
    <Paragraph>
      —Kevin Reilly, The West and the World: A History of Civilization (New
      York: Harper Collins, 1989).
    </Paragraph>
  </div>
);

// I've extracted these so that I can display the same text on the first and third screens.
const firstScreenChoices = [
  "Mark Nathan Cohen’s interpretation that the advent of agriculture was a negative development in human history",
  "Kevin Reilly’s interpretation that the advent of agriculture was a positive development in human history",
];

// TODO: implement colored highlight spans
const modules = (getUserInput, getRemoteData) => [
  <TwoUpPrompt referenceComponent={humanitiesPassage}>
    <Heading>
      1. In the first passage, select the sentence which shows the main idea in
      orange.
    </Heading>
    <Heading>
      2. In the second passage, select the sentence which shows the main idea in
      blue.
    </Heading>
    <Heading>3. Select the intepretation you think is more defensible:</Heading>
    <MultipleChoice dataKey="interpretation" choices={firstScreenChoices} />
    <Heading>
      4. Explain why the interpretation you chose is more plausible. Highlight
      the relevant evidence in purple and explain why it supports the
      interpretation.
    </Heading>
    <RichEditor dataKey="interpretationExplanation" />
  </TwoUpPrompt>,

  // Second screen depends on agreeing with Mark Cohen vs. Kevin Reilly.
  getUserInput(0).interpretation === 0 ? (
    <TwoUpPrompt referenceComponent={humanitiesPassage}>
      <Heading>
        1. This student agreed that Mark Nathan Cohen’s interpretation that the
        advent of agriculture was a negative development in human history’s
        interpretation was more defensible. They found this interpretation more
        plausible because:
      </Heading>
      <Paragraph>{getRemoteData("otherStudentResponse")}</Paragraph>
      <Heading>
        2. Did they have the same reasons for arriving at that conclusion as you
        provided?
      </Heading>
      <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
      {getUserInput(1).otherIsSame ===
      undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
        1,
      ).otherIsSame === 0 ? (
        <Heading>Summarize their reasoning</Heading>
      ) : (
        <Heading>Why not?</Heading>
      )}
      {getUserInput(1).otherIsSame ===
      undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
        <RichEditor dataKey="explanation" />
      )}
    </TwoUpPrompt>
  ) : (
    <TwoUpPrompt referenceComponent={humanitiesPassage}>
      <Heading>
        1. This student disagreed that Mark Nathan Cohen’s interpretation was
        more defensible. They found the Kevin Reilly’s interpretation more
        plausible because:
      </Heading>
      <Paragraph>{getRemoteData("otherStudentResponse")}</Paragraph>
      <Heading>2. Did they focus on the same evidence as you did?</Heading>
      <MultipleChoice dataKey="otherIsSame" choices={["Yes", "No"]} />
      {getUserInput(1).otherIsSame ===
      undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
        1,
      ).otherIsSame === 0 ? (
        <Heading>
          Since you had the same evidence, why do you think you came to
          different conclusions?
        </Heading>
      ) : (
        <Heading>
          a. Do you think the evidence they chose is relevant? b. Does the
          evidence they chose support the interpretation they chose&gt;?
        </Heading>
      )}
      {getUserInput(1).otherIsSame ===
      undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
        <RichEditor dataKey="explanation" />
      )}
    </TwoUpPrompt>
  ),

  <TwoUpPrompt referenceComponent={humanitiesPassage}>
    <Heading>
      1. Here is your original chosen interpretation and reasoning:
    </Heading>
    <Paragraph>{firstScreenChoices[getUserInput(0).interpretation]}</Paragraph>
    <Paragraph>{getUserInput(0).interpretationExplanation}</Paragraph>
    <Heading>2. Would you change your reasoning?</Heading>
    <MultipleChoice dataKey="choice" choices={["Yes", "No"]} />
    {getUserInput(2).choice ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
      2,
    ).choice === 0 ? (
      <Heading>TODO this copy not yet designed</Heading>
    ) : (
      <Heading>TODO this copy not yet designed</Heading>
    )}
    {getUserInput(2).choice ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
      <RichEditor dataKey="explanation" />
    )}
  </TwoUpPrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["inputs[0].interpretation"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async ([interpretation], userID, cohort) => {
      if (interpretation === undefined) {
        return undefined;
      } else {
        const alternativeInterpretation = interpretation ? 1 : 0;
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesA/${cohort}`)
          .orderByChild("inputs/0/interpretation")
          .equalTo(alternativeInterpretation)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {}).map(
          userID => otherResponsesByUserID[userID].inputs,
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
          return Plain.deserialize(
            "There is no other student response.",
          ).toJSON();
        }
      }
    },
  },
};

export default { modules, remoteDataRequirements };
