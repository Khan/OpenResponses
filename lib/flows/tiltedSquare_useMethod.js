import { Raw, Plain } from "slate";

import AnswerGrid from "../components/answer-grid";
import BasePrompt from "../components/modules/base-prompt";
import { loadData } from "../db";
import Heading from "../components/heading";
import Image from "../components/image";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import Scratchpad from "../components/scratchpad";
import ScratchpadPlayer from "../components/scratchpad-player";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "tiltedSquare_useMethod";

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const canvasSize = {
  width: 516,
  height: 491,
};

const modules = (getUserInput, getRemoteData, dispatcher) => [
  // 0
  <BasePrompt>
    <Heading>
      Find the area of the “3 by 5” tilted square. Show your reasoning.
    </Heading>
    <Scratchpad dataKey="scratchpad">
      <Image path="tiltedSquare/3 by 5.png" centered />
    </Scratchpad>
  </BasePrompt>,

  // 1
  getRemoteData("scratchpads").scratchpads
    ? <BasePrompt>
        <Paragraph>
          Here are some solutions from other learners. Do they use the same
          reasoning as you?
        </Paragraph>
        <Heading>Select one that used a different method than you did.</Heading>
        <AnswerGrid
          dataKey="selection"
          responseData={(getRemoteData("scratchpads") || {}).scratchpads}
          radio
          {...canvasSize}
          scaleFactor={0.6}
          penWidth={2}
        >
          <Image path="tiltedSquare/3 by 5.png" centered />
        </AnswerGrid>
      </BasePrompt>
    : <BasePrompt>
        <Heading>Loading…</Heading>
      </BasePrompt>,

  // 2
  getRemoteData("reviewee").scratchpad
    ? <TwoUpPrompt
        referenceComponent={
          <div>
            <Paragraph>Here is the solution you chose.</Paragraph>
            <ScratchpadPlayer
              data={(getRemoteData("reviewee") || {}).scratchpad}
              backgroundColor="white"
            >
              <Image path="tiltedSquare/3 by 5.png" centered />
            </ScratchpadPlayer>
          </div>
        }
        passThroughInManagerUI
      >
        <Paragraph>
          Use **this person's method** to solve this new problem:
        </Paragraph>
        <Heading>Find the area of the “3 by 4” tilted square below.</Heading>
        <Scratchpad dataKey="feedback">
          <Image path="tiltedSquare/3 by 4.png" centered />
        </Scratchpad>
      </TwoUpPrompt>
    : <BasePrompt>
        <Heading>Loading…</Heading>
      </BasePrompt>,

  // 3
  getRemoteData("_inbox") &&
  extractFeedbackFromInbox(getRemoteData("_inbox")).length > 0
    ? <TwoUpPrompt
        referenceComponent={
          <div>
            <Paragraph>
              Another student chose to use **your method**. Here is what they
              did:
            </Paragraph>
            <ScratchpadPlayer
              data={
                extractFeedbackFromInbox(getRemoteData("_inbox"))[0].feedback
              }
              backgroundColor="white"
              playing
            >
              <Image path="tiltedSquare/3 by 4.png" centered />
            </ScratchpadPlayer>
          </div>
        }
      >
        <Heading>Did this student use the ideas in your method?</Heading>
        <MultipleChoice
          choices={["Yes", "Somewhat", "Not really"]}
          dataKey="didTheyUseYourIdea"
        />
        <Heading>
          Did this student’s work make you think any new ideas about this
          problem?
        </Heading>
        <MultipleChoice
          choices={["Yes", "Somewhat", "Not really"]}
          dataKey="didTheyMakeYouThink"
        />
      </TwoUpPrompt>
    : <BasePrompt blockNextButton>
        <Heading>Thank you!</Heading>
        <Paragraph>
          That's the end of the activity, but: another student may choose to use
          *your* work like just you did with one of your peers!
        </Paragraph>
        <Paragraph>
          If that happens, this page will automatically refresh to show how they
          used your work. You'll also receive an email with a link back to here.
        </Paragraph>
      </BasePrompt>,

  // 4
  <BasePrompt>
    <Heading>You're all done!</Heading>
  </BasePrompt>,
];

const maximumTimesResponseShown = 8;
const numberOfReviewees = 6;

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  scratchpads: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (furthestPageLoaded < 1) {
        return undefined;
      }

      const otherStudentResponses = await loadData(flowName, cohort);
      const otherUserIDs = Object.keys(otherStudentResponses || {}).filter(
        otherUserID =>
          userID !== otherUserID && otherStudentResponses[otherUserID].inputs,
      );

      const scratchpads = otherUserIDs.map(userID => ({
        key: userID,
        data: otherStudentResponses[userID].inputs[0].scratchpad,
      }));
      return { scratchpads };
    },
  },

  reviewee: {
    inputs: ["userState.furthestPageLoaded", "inputs[1].selection"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async (
      [furthestPageLoaded, selectedUserID],
      userID,
      cohort,
      { userState },
    ) => {
      if (furthestPageLoaded < 2) {
        return undefined;
      }
      if (userState.reviewees) {
        return { scratchpad: userState.reviewees[0].submission };
      }

      const otherStudentData = await loadData(flowName, cohort, selectedUserID);
      const otherStudentScratchpad = otherStudentData.inputs[0].scratchpad;

      return {
        remoteData: {
          scratchpad: otherStudentScratchpad,
        },
        newUserState: {
          reviewees: [
            {
              userID: selectedUserID,
              submission: otherStudentScratchpad,
            },
          ],
        },
      };
    },
  },
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, 2, 3],
};
