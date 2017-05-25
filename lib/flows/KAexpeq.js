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
import ScratchpadPlayer from "../components/scratchpad-player";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "KAexpeq";

const canvasSize = {
  width: 764,
  height: 550,
};

const choices = [
  " -6r - 2",
  " -6r - 16",
  " -39r - 2",
  " -39r - 16",
  " -41r - 2",
  " -41r - 16",
];

const modules = (getUserInput, getRemoteData) => [
  // 0

  <BasePrompt>
    <Paragraph>
      Equivalent Expressions
    </Paragraph>
    <Scratchpad
      dataKey="scratchpad"
      paddingHorizontal={150}
      paddingBottom={150}
    >
      <Image path="KAexpeq/KAexpeqV2.png" />
    </Scratchpad>
  </BasePrompt>,

  // 1

  <BasePrompt>
    <Paragraph>
      Now you can see the work of other students.
    </Paragraph>
    <Paragraph>
      Select a work sample or two that you feel is *helpful*, *interesting*, or that *gives you an idea*.
    </Paragraph>
    <AnswerGrid
      dataKey="selections"
      responseData={(getRemoteData("scratchpads") || {}).scratchpads}
      {...canvasSize}
    >
      <Image path="KAexpeq/KAexpeqV2.png" />
    </AnswerGrid>
  </BasePrompt>,

  // 2

  // <TwoUpPrompt
  //   referenceComponent={
  //     <AnswerGrid
  //       responseData={(getRemoteData("selectedScratchpads") || {}).scratchpads}
  //       layout="narrow"
  //       {...canvasSize}
  //       playing
  //     >
  //       <Image path="KAexpeq/KAexpeqV2.png" />
  //     </AnswerGrid>
  //   }
  // >
  //   <Heading>
  //     What concepts are people using? Are there mistakes to avoid in this kind of problem?
  //   </Heading>
  //   <RichEditor dataKey="groupExplanation" placeholder="Test" />
  // </TwoUpPrompt>,

  // 2

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
        //playing
      >
        <Image path="KAexpeq/KAexpeqV2.png" />
      </AnswerGrid>
    }
  >
    <Paragraph>
      Here is a new problem, use the ideas you saw in the work of others to help you write a full complete solution
    </Paragraph>
    <Scratchpad
      dataKey="scratchpad"
      paddingLeft={-30}
      paddingRight={0}
      paddingBottom={500}
    >
      <Image path="KAexpeq/KAexpeq2.png" />
    </Scratchpad>
  </TwoUpPrompt>,

  // 3

  <BasePrompt>
    <Heading>Multiple Choice</Heading>
    <ScratchpadPlayer
      data={getUserInput(2).scratchpad}
      paddingLeft={-30}
      paddingRight={0}
      paddingBottom={600}
      playing
      // Image path="KAexpeq/KAexpeq2.png" // this doesn't work :) -Scott
    />
    <Paragraph>
      Expand -r + 8(-5r + 2)
    </Paragraph>
    <MultipleChoice dataKey="decision" choices={choices.map(c => `${c}.`)} />
  </BasePrompt>,

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
