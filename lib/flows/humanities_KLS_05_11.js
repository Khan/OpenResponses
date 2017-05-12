import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "humanities_KLS_05_11";

const humanitiesPassage = (
  <div>
    <Heading>Read the following two passages:</Heading>
    <Paragraph>
      _Henry Knighton was a historian and priest at St. Mary's of Leicester in England. He wrote about the Black Death:_
    </Paragraph>
    <Paragraph>
      In 1348 and 1349, many millions of people died around the world. It began first in India and moved west to Tarsus, Turkey. It killed Muslims first and then Christians and Jews. The office of the pope believed that 48 million people in Asia died suddenly in the first year. This did not include the death of Christians. The king of Tarsus was Muslim and feared that his people were being punished because they were not Christian. So he and his leaders decided to go to the pope, in France, who would baptize them and make them Christian. However, when he had completed 20 days of his journey, he heard that the plague had killed many Christians, too. So they turned back to return to Tarsus. But Christians, who had been following the king and his people, attacked and killed almost 2,000 of them.
    </Paragraph>
    <Paragraph>
      Then this most terrible plague came to the coast of England. It went through Southampton and came to Bristol. The cruel death took just two days to spread through the whole town. The Scots heard that the plague was killing their enemy, the English. They felt God was punishing England. So they planned to invade England. But the awful plague soon sickened their soldiers. Almost 5,000 died. They retreated to Scotland, but the English attacked and killed many of them.
    </Paragraph>
    <Paragraph>
      _Giovanni Boccaccio, Italian writer from Florence wrote this description of the plague:_
    </Paragraph>
    <Paragraph>
      Others thought just the opposite. They thought the sure cure for the plague was to drink and be merry, to go about singing and amusing themselves, satisfying every appetite they could, laughing and jesting at what happened. They put their words into practice, spent day and night going from tavern to tavern, drinking immoderately, or went into other people's houses, doing only those things which pleased them. This they could easily do because everyone felt doomed and had abandoned his property, so that most houses became common property and any stranger who went in made use of them as if he had owned them. And with all this bestial behaviour, they avoided the sick as much as possible.
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const firstScreenChoices = ["Henry Knighton", "Giovanni Boccaccio"];

const modules = (getUserInput, getRemoteData) => [
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      Imagine you are living in the 14th century.
    </Paragraph>
    <Paragraph>
      You find these two articles describing what people thought about the plague and what they tried to do about it.
    </Paragraph>
    <Heading>
      1. Which article would you believe more to help you avoid the plague?{" "}
    </Heading>
    <MultipleChoice dataKey="interpretation" choices={firstScreenChoices} />
  </TwoUpPrompt>,

  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      {
        `You said that ${firstScreenChoices[getUserInput(0).interpretation]}’s article was more believable.`
      }
    </Paragraph>
    <Heading>
      {
        `What did the people in ${firstScreenChoices[getUserInput(0).interpretation]}’s article believe about the plague?`
      }
    </Heading>
    <RichEditor dataKey="beliefSummary" placeholder="The people believed…" />
    <Heading>
      Why did you choose that article as more believable?
    </Heading>
    <RichEditor
      dataKey="beliefJustification"
      placeholder={
        `I chose ${firstScreenChoices[getUserInput(0).interpretation]} as more believable because...`
      }
    />
  </TwoUpPrompt>,

  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {
        `This student agreed and said that ${firstScreenChoices[getUserInput(0).interpretation]}‘s article was more believable to them.`
      }
    </Heading>
    <Paragraph>
      {(getRemoteData("otherStudentResponse") || {}).beliefSummary || ""}
    </Paragraph>
    <Paragraph>
      {(getRemoteData("otherStudentResponse") || {}).beliefJustification || ""}
    </Paragraph>
    <Heading>
      Summarize what the other student wrote in your own words:
    </Heading>
    <RichEditor
      dataKey="beliefJustification"
      placeholder="The other student said…"
    />
  </TwoUpPrompt>,

  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here was your original answer:
    </Heading>
    <Paragraph>
      {getUserInput(1).beliefSummary}
    </Paragraph>
    <Paragraph>
      {getUserInput(1).beliefJustification}
    </Paragraph>
    <Heading>
      Here is the other student’s original answer:
    </Heading>
    <Paragraph>
      {(getRemoteData("otherStudentResponse") || {}).beliefSummary || ""}
    </Paragraph>
    <Paragraph>
      {(getRemoteData("otherStudentResponse") || {}).beliefJustification || ""}
    </Paragraph>
    <Paragraph>
      Did you use the same evidence as the other student? What was similar or different about your arguments?
    </Paragraph>
    <RichEditor dataKey="comparison" />
  </TwoUpPrompt>,

  <BasePrompt>
    <Heading>Thank you!</Heading>
  </BasePrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["inputs[0].interpretation", "userState.furthestPageLoaded"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async (
      [interpretation, furthestPageLoaded],
      userID,
      cohort,
      { userState },
    ) => {
      if (userState && userState.otherStudentResponseUserID) {
        const otherStudentData = await loadData(
          flowName,
          cohort,
          userState.otherStudentResponseUserID,
        );
        return otherStudentData.inputs[1];
      }
      if (interpretation === undefined || userState.furthestPageLoaded < 1) {
        return undefined;
      } else {
        console.log(
          "Finding a student whose interpretation is also",
          interpretation,
        );
        const otherResponseSnapshot = await _getDatabase()
          .ref(`${flowName}/${cohort}`)
          .orderByChild("inputs/0/interpretation")
          .equalTo(interpretation)
          .once("value");
        const otherStudentResponses = otherResponseSnapshot.val();
        console.log("snapshot", otherStudentResponses);
        const allValidUserIDs = Object.keys(
          otherStudentResponses || {},
        ).filter(otherUserID => {
          if (otherUserID === userID) {
            return false;
          }
          const otherResponse = otherStudentResponses[otherUserID];
          if (!otherResponse.userState) {
            console.log(
              `Filtering out ${userID} because they don't have user state`,
            );
            return false;
          }

          if (!otherResponse.inputs[1].beliefJustification) {
            console.log(
              `Filtering out ${userID} because they don't have an input`,
            );
            return false;
          }

          return true;
        });
        const otherUserIDs = allValidUserIDs.filter(otherUserID => {
          const otherResponse = otherStudentResponses[otherUserID];
          if (otherResponse.userState.shownToUserID) {
            console.log(
              `Filtering out ${otherUserID} because they have already been shown to ${otherResponse.userState.shownToUserID}`,
            );
            return false;
          } else {
            return true;
          }
        });
        console.log(
          "All valid user IDs",
          allValidUserIDs,
          "Remaining userIDs:",
          otherUserIDs,
        );

        let capturedStudentID = null;
        let capturedStudentData = null;
        while (!capturedStudentID && otherUserIDs.length > 0) {
          const prospectiveStudentID = otherUserIDs.shift();

          const otherStudentRef = _getDatabase().ref(
            `${flowName}/${cohort}/${prospectiveStudentID}`,
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
            capturedStudentData = snapshot.val().inputs[1];
            console.log("Captured student ", capturedStudentID);
          }
        }

        if (capturedStudentData) {
          return {
            remoteData: capturedStudentData,
            newUserState: { otherStudentResponseUserID: capturedStudentID },
          };
        } else if (allValidUserIDs.length === 0) {
          const dummyResponse = Raw.serialize(
            Plain.deserialize("There is no other available response."),
            { terse: true },
          );
          return {
            remoteData: {
              beliefSummary: "There is no other available response.",
              beliefJustification: "There is no other available response.",
            },
            newUserState: { otherStudentResponseUserID: "dummy" },
          };
        } else {
          const randomUserID = allValidUserIDs[
            Math.floor(Math.random() * allValidUserIDs.length)
          ];
          console.log(
            `Falling back onto ${randomUserID} because there are no more free students.`,
          );
          return {
            remoteData: otherStudentResponses[randomUserID].inputs[1],
            newUserState: { otherStudentResponseUserID: randomUserID },
          };
        }
      }
    },
  },
};

export default { modules, remoteDataRequirements };
