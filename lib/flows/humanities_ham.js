import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "humanities_ham";

const humanitiesPassage = (
  <div>
    <Paragraph>
      An excerpt from “Cabinet Battle #1” by Lin-Manuel Miranda, featuring Daveed Diggs and Lin-Manuel Miranda.
    </Paragraph>
    <Paragraph>**Jefferson**</Paragraph>
    <Paragraph>
      {
        `Ooh, if the shoe fits, wear it
      If New York’s in debt—
      Why should Virginia bear it? Uh! Our debts are paid, I’m afraid
      Don’t tax the South cuz we got it made in the shade
      In Virginia, we plant seeds in the ground
      We create. You just wanna move our money around
      This financial plan is an outrageous demand
      And it’s too many damn pages for any man to understand
      Stand with me in the land of the free
      And pray to God we never see Hamilton’s candidacy
      Look, when Britain taxed our tea, we got frisky
      Imagine what gon’ happen when you try to tax our whisky`
      }
    </Paragraph>
    <Paragraph>**Hamilton**</Paragraph>
    <Paragraph>
      {
        `Thomas. That was a real nice declaration
      Welcome to the present, we’re running a real nation
      Would you like to join us, or stay mellow
      Doin’ whatever the hell it is you do in Monticello?
      If we assume the debts, the union gets
      A new line of credit, a financial diuretic
      How do you not get it? If we’re aggressive and competitive
      The union gets a boost. You’d rather give it a sedative?
      A civics lesson from a slaver. Hey neighbor
      Your debts are paid cuz you don’t pay for labor
      “We plant seeds in the South. We create.”
      Yeah, keep ranting
      We know who’s really doing the planting`
      }
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = ["Jefferson", "Hamilton"];

const modules = (getUserInput, getRemoteData) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      In Miranda's portrayal, Jefferson and Hamilton debate if the federal government should assume state debt and establish a national bank.
    </Paragraph>
    <Heading>
      Who would you say is more convincing in this dramatization?
    </Heading>
    <MultipleChoice dataKey="decision" choices={choices.map(c => `${c}.`)} />
    <Heading>
      Back up your choice with evidence from the excerpt.
    </Heading>
    <RichEditor
      dataKey="decisionExplanation"
      placeholder={
        getUserInput(1).decision !== undefined
          ? `${choices[getUserInput(0).decision]} is more convincing because...`
          : undefined
      }
    />
  </TwoUpPrompt>,

  // 1
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here’s what someone else said about the Cabinet Battle:
    </Heading>
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).decisionExplanation}
    />
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).cherylAnalysis}
    />
    <Paragraph />
    <Heading>
      Read your peer's work carefully, then click Next when you're ready to give feedback.
    </Heading>
  </TwoUpPrompt>,

  // 2
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      Here’s what someone else said about the Cabinet Battle:
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
      Evaluate your peer's work.{" "}
    </Heading>
    <Paragraph>
      Did their evidence back up their argument? How would you help them improve their work?
    </Paragraph>
    <RichEditor
      dataKey="feedback"
      placeholder="The other student argued that…"
    />
  </TwoUpPrompt>,

  // 4
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
      Who would you say is more convincing in this dramatization?
    </Paragraph>
    <RichEditor dataKey="revision" />
  </TwoUpPrompt>,

  // 5
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
        return {
          decisionExplanation: otherStudentData.inputs[1].decisionExplanation,
          cherylAnalysis: otherStudentData.inputs[2].cherylAnalysis,
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
