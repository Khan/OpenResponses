import AnswerGrid from "../components/answer-grid";
import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import Scratchpad from "../components/scratchpad";
import ScratchpadPlayer from "../components/scratchpad-player";
import TwoUpPrompt from "../components/modules/two-up-prompt";
import { _getDatabase, loadData } from "../db";

const modules = (getData, getRemoteData) => [
  <BasePrompt>
    <Heading>Testing out the big answer grid</Heading>
    <AnswerGrid
      dataKey="selections"
      responseData={getRemoteData("studentResponse").responses}
    />
  </BasePrompt>,
];

const remoteDataRequirements = {
  studentResponse: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (userState && userState.otherStudentResponseUserID) {
        const otherStudentData = await loadData(
          "cheerios",
          cohort,
          userState.otherStudentResponseUserID,
        );
        return otherStudentData.inputs[0].response;
      }

      const otherStudentsSnapshot = await _getDatabase()
        .ref(`cheerios/${cohort}`)
        .once("value");
      const otherStudentResponses = otherStudentsSnapshot.val();
      const otherUserIDs = Object.keys(otherStudentResponses || {}).filter(
        otherUserID =>
          userID !== otherUserID && otherStudentResponses[otherUserID].inputs,
      );

      const responses = otherUserIDs.map(userID => ({
        key: userID,
        data: otherStudentResponses[userID].inputs[1].scratchpad,
      }));
      return { responses };
    },
  },
};

export default { modules, remoteDataRequirements };
