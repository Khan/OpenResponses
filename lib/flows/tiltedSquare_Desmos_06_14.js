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

const flowName = "tiltedSquare_Desmos_06_14";

const canvasSize = {
  width: 764,
  height: 519,
};

const modules = (getUserInput, getRemoteData) => [
  <BasePrompt>
    <Paragraph>
      This square can be called a 3 by 5 tilted square.
    </Paragraph>
    <Paragraph>
      {
        `1. Draw a 4 by 4 tilted square.
      2. What do you notice about the tilted squares? What do you wonder? Draw your noticings and wonderings.`
      }
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
    <Paragraph>
      Now you can see the work of other students.
    </Paragraph>
    <Paragraph>
      *Select three* of the samples that noticed or wondered something different than you did.
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
      Find the area of the 3 by 5 tilted square.{" "}
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

  // left side is a solution from someone else, best case someone who was "inspired" by this student's work
  // right side asking follow on, final question... not going to act on that input.
  <TwoUpPrompt>
    <Heading>3 by 5 Tilted Square</Heading>
    <Paragraph>Here is someone else's solution.</Paragraph>
    <RichEditor
      dataKey="feedback"
      placeholder="The other student argued that…"
    />
  </TwoUpPrompt>,
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
