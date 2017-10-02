import AnswerGrid from "../components/answer-grid";
import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import Scratchpad from "../components/scratchpad";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "tiltedSquare_KLS_06_01";

const canvasSize = {
  width: 764,
  height: 519,
};

const modules = (getUserInput, getRemoteData) => [
  <BasePrompt>
    <Paragraph>This square can be called a 3 by 5 tilted square.</Paragraph>
    <Paragraph>
      {`1. Draw a 4 by 4 tilted square.
      2. Think: which square would you guess is bigger?
      3. Draw an idea of how you might show your guess is right. Try to think of something different than other students.`}
    </Paragraph>
    <Scratchpad
      dataKey="scratchpad"
      paddingLeft={150}
      paddingRight={150}
      paddingBottom={50}
    >
      <Image path="tiltedSquare/tiltedSquare_larger_grid.png" />
    </Scratchpad>
  </BasePrompt>,

  <BasePrompt>
    <Paragraph>Now you can see the work of other students.</Paragraph>
    <Paragraph>
      *Select three* of the samples that would fit as a group. You can make a
      group of similar samples or a group of different samples.
    </Paragraph>
    <AnswerGrid
      dataKey="selections"
      responseData={(getRemoteData("scratchpads") || {}).scratchpads}
      {...canvasSize}
    >
      <Image path="tiltedSquare/tiltedSquare_larger_grid.png" />
    </AnswerGrid>
  </BasePrompt>,

  <TwoUpPrompt
    referenceComponent={
      <AnswerGrid
        responseData={[
          ...(getUserInput(0).scratchpad
            ? [{ data: getUserInput(0).scratchpad, key: "me" }]
            : []),
          ...((getRemoteData("selectedScratchpads") || {}).scratchpads || []),
        ]}
        layout="narrow"
        {...canvasSize}
        playing
      >
        <Image path="tiltedSquare/tiltedSquare_larger_grid.png" />
      </AnswerGrid>
    }
  >
    <Heading>
      Now use some ideas from the group you selected to find the area of the 3
      by 5 tilted square.
    </Heading>
    <Scratchpad
      dataKey="scratchpad"
      paddingLeft={25}
      paddingRight={25}
      paddingBottom={205}
    >
      <Image path="tiltedSquare/tiltedSquare.png" centered />
    </Scratchpad>
  </TwoUpPrompt>,

  <BasePrompt>
    <Heading>Thank you!</Heading>
  </BasePrompt>,
];

const remoteDataRequirements = {
  scratchpads: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (furthestPageLoaded < 1) {
        return undefined;
      }

      const otherStudentsSnapshot = await _getDatabase()
        .ref(`${flowName}/${cohort}`)
        .once("value");
      const otherStudentResponses = otherStudentsSnapshot.val();
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

  selectedScratchpads: {
    inputs: ["inputs[1].selections"],
    fetcher: async ([selections], userID, cohort) => {
      if (!selections) {
        return undefined;
      }

      const scratchpads = [];
      for (const selection of selections) {
        const studentData = await loadData(flowName, cohort, selection);
        if (!studentData) {
          continue;
        }
        scratchpads.push({
          key: selection,
          data: studentData.inputs[0].scratchpad,
        });
      }
      return { scratchpads };
    },
  },
};

export default { modules, remoteDataRequirements };
