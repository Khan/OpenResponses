import Plain from "slate-plain-serializer";

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
    <Paragraph>Longer passage that has many different causal factors</Paragraph>
  </div>
);

// TODO: These factors are placeholders.
const factors = [
  "Environmental",
  "Cultural",
  "State-building",
  "A mix of the above",
];

// I've extracted these strings because they're used in the middle screens depending on the student's choice in the first screen.
const interpretations = [
  "Marshall Sahlins' interpretation was more defensible",
  "Jared Diamond's interpretation was more defensible",
  "both interpretations were equally defensible",
];

const modules = (getUserInput, getRemoteData) => [
  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>1. What do you think was the main reason for X?</Heading>
    <RichEditor dataKey="reason" />
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>Here's what you said:</Heading>
    <Paragraph>{getUserInput(0).reason}</Paragraph>
    <Heading>1. What do you think is the most important factor in X?</Heading>
    <MultipleChoice dataKey="factor" choices={factors} />
    {getUserInput(1).sameReasons ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
      1,
    ).sameReasons !== 3 ? (
      <Heading>
        What did you cite as evidence for the most important factor?
      </Heading>
    ) : (
      <Heading>Revise your original response. TODO wording here</Heading>
    )}
    {getUserInput(1).sameReasons ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
      <RichEditor dataKey="response" />
    )}
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. This student agreed that {factors[getUserInput(1).factor]} was the most
      important factor. Here's why:
    </Heading>
    <Paragraph>{getRemoteData("agreeingStudentResponse")}</Paragraph>
    <Heading>2. Did they cite the same evidence?</Heading>
    <MultipleChoice dataKey="sameEvidence" choices={["Yes", "No"]} />
    {getUserInput(2).sameEvidence ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
      2,
    ).sameEvidence === 0 ? (
      /* TODO These prompts need work. */
      <Heading>Summarize their reasoning</Heading>
    ) : (
      <Heading>Why not?</Heading>
    )}
    {getUserInput(2).sameEvidence ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
      <RichEditor dataKey="explanation" />
    )}
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>
      1. This student disagreed that {factors[getUserInput(1).factor]} was the
      most important factor. They believed that{" "}
      {factors[getRemoteData("disagreeingStudentResponse").choice]} was the most
      important factor instead. Here's why:
    </Heading>
    <Paragraph>
      {getRemoteData("disagreeingStudentResponse").explanation}
    </Paragraph>
    <Heading>2. Did they focus on the same evidence as you did?</Heading>
    <MultipleChoice dataKey="sameEvidence" choices={["Yes", "No"]} />
    {getUserInput(3).sameEvidence ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
      3,
    ).sameEvidence === 0 ? (
      <Heading>
        Since you had the same evidence, why do you think you came to different
        conclusions?
      </Heading>
    ) : (
      <Heading>
        a. Do you think that the evidence they chose is relevant? b. Does the
        evidence they chose support the interpretation they chose?
      </Heading>
    )}
    {getUserInput(3).sameEvidence ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
      <RichEditor dataKey="explanation" />
    )}
  </TwoUpPrompt>,

  <TwoUpPrompt referenceComponent={referencePassage}>
    <Heading>1. Here is your original reasoning:</Heading>
    <Paragraph>{getUserInput(0).reason}</Paragraph>
    <Paragraph>
      {`Most important factor: ${factors[getUserInput(1).factor]}`}
    </Paragraph>
    <Heading>2. Would you change your reasoning?</Heading>
    <MultipleChoice dataKey="choice" choices={["Yes", "No"]} />
    {getUserInput(4).choice ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : getUserInput(
      4,
    ).choice === 0 ? (
      <Heading>TODO this copy not yet designed</Heading>
    ) : (
      <Heading>TODO this copy not yet designed</Heading>
    )}
    {getUserInput(4).choice ===
    undefined ? null /* Hide this part of the question until they choose an answer above. */ : (
      <RichEditor dataKey="explanation" />
    )}
  </TwoUpPrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  agreeingStudentResponse: {
    // Our choice of other student response depends on this student's choice of factor:
    inputs: ["inputs[1].factor"],
    // Given the student's choice, find another student who agrees.
    fetcher: async ([factor], userID) => {
      if (factor === undefined) {
        return undefined;
      } else {
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesC/${cohort}`)
          .orderByChild("inputs/1/factor")
          .equalTo(factor)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {})
          // Don't show the student their own work.
          .filter(otherResponseUserID => userID !== otherResponseUserID)
          .map(userID => otherResponsesByUserID[userID].inputs)
          // Filter out other students without real explanations.
          .filter(response => {
            return response[0].reason;
          });
        if (otherResponses.length > 0) {
          // TODO(andy): Right now, we just take the first. We will need to design something more sophisticated here... once we figure out what we want!
          const chosenResponse = otherResponses[0];
          return chosenResponse[0].reason;
        } else {
          // TODO(andy): We must decide what we want to do in this case. Probably display a curated response.
          return Plain.deserialize(
            "There is no other student response.",
          ).toJSON();
        }
      }
    },
  },

  // TODO(andy): Fix duplication here.
  disagreeingStudentResponse: {
    // Our choice of other student response depends on this student's choice of factor:
    inputs: ["inputs[1].factor"],
    // Given the student's choice, find another student who agrees.
    fetcher: async ([factor], userID, cohort) => {
      if (factor === undefined) {
        return undefined;
      } else {
        // Here's a tricky thing: Firebase doesn't offer a NOT filter. We can only find entries which *match* a particular parameter. Some options:
        // 1. Fetch them all and filter client-side.
        // 2. Pick a random different factor choice to filter by.
        // 3. Pick a deterministic other factor choice to filter by (always incrementing by 1).
        // We'll roll with #2 for now, but it's kind of uncomfortable.
        const otherFactorChoice = (factor + Math.ceil(Math.random() * 3)) % 4;
        const otherResponseSnapshot = await _getDatabase()
          .ref(`humanitiesC/${cohort}`)
          .orderByChild("inputs/1/factor")
          .equalTo(otherFactorChoice)
          .once("value");
        const otherResponsesByUserID = otherResponseSnapshot.val();
        const otherResponses = Object.keys(otherResponsesByUserID || {})
          .map(userID => otherResponsesByUserID[userID].inputs)
          // Filter out other students without real explanations.
          .filter(response => {
            return response[0].reason;
          });
        if (otherResponses.length > 0) {
          // TODO(andy): Right now, we just take the first. We will need to design something more sophisticated here... once we figure out what we want!
          const chosenResponse = otherResponses[0];
          return {
            choice: chosenResponse[1].factor,
            explanation: chosenResponse[0].reason,
          };
        } else {
          // TODO(andy): We must decide what we want to do in this case. Probably display a curated response.
          return {
            choice: 2,
            explanation: Plain.deserialize(
              "There is no other student response.",
            ).toJSON(),
          };
        }
      }
    },
  },
};

export default { modules, remoteDataRequirements };
