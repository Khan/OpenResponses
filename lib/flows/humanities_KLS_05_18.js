import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "humanities_KLS_05_18";

const humanitiesPassage = (
  <div>
    <Paragraph>An excerpt from _Wild_ by Cheryl Strayed:</Paragraph>
    <Paragraph>
      “The trees were tall, but I was taller, standing above them on a steep mountain slope in northern California. Moments before, I'd removed my hiking boots and the left one had fallen into those trees, first catapulting into the air when my enormous backpack toppled onto it, then skittering across the gravelly trail and flying over the edge. It bounced off a rocky outcropping several feet beneath me before disappearing into the forest canopy below, impossible to retrieve. I let out a stunned gasp, though I'd been in the wilderness thirty-eight days and by then I'd come to know that anything could happen and that everything would. But that doesn't mean I wasn't shocked when it did.
    </Paragraph>
    <Paragraph>My boot was gone. Actually gone.</Paragraph>
    <Paragraph>
      I clutched its mate to my chest like a baby, though of course it was futile. What is one boot without the other boot? It is nothing. It is useless, an orphan forevermore, and I could take no mercy on it. It was a big lug of a thing, of genuine heft, a brown leather Raichle boot with a red lace and silver metal fasts. I lifted it high and threw it with all my might and watched it fall into the lush trees and out of my life.
    </Paragraph>
    <Paragraph>
      I was alone. I was barefoot. I was twenty-six years old and an orphan too.”
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = [
  "Yes, I would throw the other boot off the cliff",
  "No, I would keep the other boot",
];

const modules = (getUserInput, getRemoteData) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Take a few minutes to read the passage.
    </Heading>
    <Paragraph>
      Think about sentences or statements that directly connect to the character’s environment and/or current situation.
    </Paragraph>
  </TwoUpPrompt>,

  // 1
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Would you have made the same decision Cheryl did—to throw the boot off the cliff?
    </Heading>
    <MultipleChoice dataKey="decision" choices={choices.map(c => `${c}.`)} />
    <Heading>
      Why?
    </Heading>
    <RichEditor
      dataKey="decisionExplanation"
      placeholder={
        getUserInput(1).decision !== undefined
          ? `${choices[getUserInput(1).decision]} because…`
          : undefined
      }
    />
  </TwoUpPrompt>,

  // 2
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      You wrote:
    </Heading>
    <RichEditor quotedWork data={getUserInput(1).decisionExplanation} />
    <Paragraph>
      Now think about Cheryl, the author and main character. Why do you think she made the choice to throw the other boot over the edge? Use a direct quote or evidence from the passage to support your answer.
    </Paragraph>
    <RichEditor
      dataKey="cherylAnalysis"
      placeholder="Cheryl decided to throw the other boot because…"
    />
  </TwoUpPrompt>,

  // 3
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here’s what someone else said about Cheryl’s decision:
    </Heading>
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).decisionExplanation}
    />
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).cherylAnalysis}
    />
    <Paragraph>
      Soon you will get a chance to revise your answer to improve it. Right now, you have a chance to help another student improve their answer.
    </Paragraph>
    <Heading>
      Read your peer's work carefully, then click Next when you're ready to give feedback.
    </Heading>
  </TwoUpPrompt>,

  // 4
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here’s what someone else said about Cheryl’s decision:
    </Heading>
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).decisionExplanation}
    />
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).cherylAnalysis}
    />
    <Heading>
      Write a note to help this student improve their answer.
    </Heading>
    <Paragraph>
      {
        `Think about these question when writing feedback:
1. Did you and the other student find the same evidence for Cheryl’s decision?
2. What do you like about the other student’s argument?
3. What is a question you have about the argument or evidence they used?`
      }
    </Paragraph>
    <RichEditor
      dataKey="feedback"
      placeholder="The other student argued that…"
    />
  </TwoUpPrompt>,

  // 5
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here is what you originally wrote:
    </Heading>
    <RichEditor quotedWork data={getUserInput(1).decisionExplanation} />
    <RichEditor quotedWork data={getUserInput(2).cherylAnalysis} />
    <Heading>
      Another student gave you this feedback:
    </Heading>
    <RichEditor quotedWork data={(getRemoteData("feedback") || {}).feedback} />
    <Heading>
      Now you can write an improved answer to the question.
    </Heading>
    <Paragraph>
      Why do you think Cheryl (the author and main character) made the choice to throw the other boot over the edge? Discuss the pros and cons of that decision.
    </Paragraph>
    <RichEditor dataKey="revision" />
  </TwoUpPrompt>,

  // 6
  <BasePrompt>
    <Heading>Thank you!</Heading>
  </BasePrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["userState.furthestPageLoaded"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (userState && userState.otherStudentResponseUserID) {
        const otherStudentData = await loadData(
          flowName,
          cohort,
          userState.otherStudentResponseUserID,
        );
        if (!otherStudentData || !otherStudentData.inputs) {
          return undefined;
        }
        return {
          decisionExplanation: otherStudentData.inputs[1] &&
            otherStudentData.inputs[1].decisionExplanation,
          cherylAnalysis: otherStudentData.inputs[2] &&
            otherStudentData.inputs[2].cherylAnalysis,
        };
      }

      // Don't assign them another student's response until they've reached the page where that's necessary.
      if (userState.furthestPageLoaded < 3) {
        return undefined;
      } else {
        console.log("Finding a student whose answer hasn't been shown yet.");
        const otherResponseSnapshot = await _getDatabase()
          .ref(`${flowName}/${cohort}`)
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
            const otherStudentData = snapshot.val();
            capturedStudentData = {
              decisionExplanation: otherStudentData.inputs[
                1
              ].decisionExplanation,
              cherylAnalysis: otherStudentData.inputs[2].cherylAnalysis,
            };
            console.log(
              "Captured student ",
              capturedStudentID,
              capturedStudentData,
            );
          }
        }

        if (capturedStudentData) {
          return {
            remoteData: capturedStudentData,
            newUserState: { otherStudentResponseUserID: capturedStudentID },
          };
        } else if (allValidUserIDs.length === 0) {
          return {
            remoteData: {
              decisionExplanation: "There is no other available response.",
              cherylAnalysis: "There is no other available response.",
            },
            newUserState: { otherStudentResponseUserID: "dummy" },
          };
        } else {
          // TODO(andy): Oh, crap, if we get to this state, there's not actually going to be any feedback for this student. Oh, well.
          const randomUserID = allValidUserIDs[
            Math.floor(Math.random() * allValidUserIDs.length)
          ];
          console.log(
            `Falling back onto ${randomUserID} because there are no more free students.`,
          );
          const otherStudentData = otherStudentResponses[randomUserID];
          return {
            remoteData: {
              decisionExplanation: otherStudentData.inputs[
                1
              ].decisionExplanation,
              cherylAnalysis: otherStudentData.inputs[2].cherylAnalysis,
            },
            newUserState: { otherStudentResponseUserID: randomUserID },
          };
        }
      }
    },
  },

  feedback: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["userState.furthestPageLoaded"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      // Don't try to pull feedback until the student arrives at that page.
      if (furthestPageLoaded < 5) {
        return undefined;
      } else if (userState && userState.shownToUserID) {
        const otherStudentData = await loadData(
          flowName,
          cohort,
          userState.shownToUserID,
        );
        if (!otherStudentData || !otherStudentData.inputs) {
          return undefined;
        }
        return {
          feedback: otherStudentData.inputs[4].feedback,
        };
      } else {
        return undefined;
      }
    },
  },
};

export default { modules, remoteDataRequirements };
