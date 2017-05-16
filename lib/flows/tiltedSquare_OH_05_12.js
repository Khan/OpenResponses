import { Raw, Plain } from "slate";

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

const flowName = "tiltedSquare_OH_05_12";

const canvasSize = {
  width: 764,
  height: 550,
};

const modules = (getUserInput, getRemoteData) => [
  <BasePrompt>
    <Paragraph>
      This square can be called a 3 by 5 tilted square.
    </Paragraph>
    <Paragraph>
      Find its area by any method, and show your reasoning.
    </Paragraph>
    <Scratchpad
      dataKey="scratchpad"
      paddingHorizontal={150}
      paddingBottom={150}
    >
      <Image path="tiltedSquare/tiltedSquare.png" centered />
    </Scratchpad>
  </BasePrompt>,

  <BasePrompt>
    <Paragraph>
      Now you can see the work of other students.
    </Paragraph>
    <Paragraph>
      *Select three* of the samples that would fit as a group. You can make a group of similar samples or a group of different samples.
    </Paragraph>
    <AnswerGrid
      dataKey="selections"
      responseData={(getRemoteData("scratchpads") || {}).scratchpads}
      {...canvasSize}
    >
      <Image path="tiltedSquare/tiltedSquare.png" centered />
    </AnswerGrid>
  </BasePrompt>,

  <TwoUpPrompt
    referenceComponent={
      <AnswerGrid
        responseData={(getRemoteData("selectedScratchpads") || {}).scratchpads}
        layout="narrow"
        {...canvasSize}
        playing
      >
        <Image path="tiltedSquare/tiltedSquare.png" centered />
      </AnswerGrid>
    }
  >
    <Heading>
      What mathematical method or ideas is this group working on?
    </Heading>
    <RichEditor dataKey="groupExplanation" placeholder="Test" />
  </TwoUpPrompt>,

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
        <Image path="tiltedSquare/tiltedSquare.png" centered />
      </AnswerGrid>
    }
  >
    <Heading>
      Use some ideas from the group you selected to do the problem in a different way than you began with:
    </Heading>
    <Paragraph>
      This square can be called a 3 by 5 tilted square. Find its area by any method, and show your reasoning.
    </Paragraph>
    <Scratchpad
      dataKey="scratchpad"
      paddingLeft={-30}
      paddingRight={0}
      paddingBottom={100}
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
      const scratchpads = [];
      for (const selection of selections) {
        const studentData = await loadData(flowName, cohort, selection);
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
