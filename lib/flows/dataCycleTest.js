import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const modules = (getUserInput, getRemoteData) => [
  <BasePrompt>
    <RichEditor dataKey="response" />
  </BasePrompt>,
  <BasePrompt>
    <Paragraph>{getRemoteData("otherStudentResponse")}</Paragraph>
  </BasePrompt>,
];

// TODO(andy): Extract flow IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (furthestPageLoaded < 1) {
        return undefined;
      }
      if (userState && userState.otherStudentResponseUserID) {
        const otherStudentData = await loadData(
          "dataCycleTest",
          cohort,
          userState.otherStudentResponseUserID,
        );
        return otherStudentData.inputs[0].response;
      }

      const otherStudentsSnapshot = await _getDatabase()
        .ref(`dataCycleTest/${cohort}`)
        .orderByChild("userState/shownToUserID")
        .equalTo(null)
        .limitToFirst(100)
        .once("value");
      const otherStudentResponses = otherStudentsSnapshot.val();
      const otherUserIDs = Object.keys(otherStudentResponses || {}).filter(
        otherUserID => userID !== otherUserID,
      );

      let capturedStudentID = null;
      let capturedStudentData = null;
      while (!capturedStudentID) {
        const prospectiveStudentID = otherUserIDs.shift();

        if (
          !otherStudentResponses[prospectiveStudentID].userState ||
          otherStudentResponses[
            prospectiveStudentID
          ].userState.furthestPageLoaded < 1
        ) {
          console.log(
            "Skipping student because they're still on the first page ",
            prospectiveStudentID,
          );
          continue;
        }

        const otherStudentRef = _getDatabase().ref(
          `dataCycleTest/${cohort}/${prospectiveStudentID}`,
        );
        console.log("Attempting to capture student ", prospectiveStudentID);
        const {
          committed,
          snapshot,
        } = await otherStudentRef.transaction(otherStudentData => {
          if (
            otherStudentData &&
            otherStudentData.userState &&
            otherStudentData.userState.shownToUserID
          ) {
            console.log("Aborting capture of student ", prospectiveStudentID);
            return undefined;
          } else {
            return {
              ...otherStudentData,
              userState: {
                ...(otherStudentData && otherStudentData.userState),
                shownToUserID: userID,
              },
            };
          }
        });
        if (committed) {
          capturedStudentID = prospectiveStudentID;
          capturedStudentData = snapshot.val().inputs[0].response;
          console.log("Captured student ", capturedStudentID);
        }
      }

      if (capturedStudentData) {
        return {
          remoteData: capturedStudentData,
          newUserState: { otherStudentResponseUserID: capturedStudentID },
        };
      } else {
        return Raw.serialize(
          Plain.deserialize("There is no other available response."),
          { terse: true },
        );
      }
    },
  },
};

export default { modules, remoteDataRequirements };
