import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "humanities_ham_async";

const humanitiesPassage = (
  <div>
    <Paragraph>
      An excerpt from “Cabinet Battle #1” by Lin-Manuel Miranda, featuring
      Daveed Diggs and Lin-Manuel Miranda.
    </Paragraph>
    <Paragraph>**Jefferson**</Paragraph>
    <Paragraph>
      {`Ooh, if the shoe fits, wear it
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
      Imagine what gon’ happen when you try to tax our whisky`}
    </Paragraph>
    <Paragraph>**Hamilton**</Paragraph>
    <Paragraph>
      {`Thomas. That was a real nice declaration
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
      We know who’s really doing the planting`}
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = ["Jefferson", "Hamilton"];

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const modules = (getUserInput, getRemoteData) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      In Miranda's portrayal, Jefferson and Hamilton debate if the federal
      government should assume state debt and establish a national bank.
    </Paragraph>
    <Heading>
      Who would you say is more convincing in this dramatization?
    </Heading>
    <MultipleChoice dataKey="decision" choices={choices} />
    <Heading>Back up your choice with evidence from the excerpt.</Heading>
    <RichEditor
      dataKey="decisionExplanation"
      placeholder={
        getUserInput(0).decision !== undefined
          ? `${choices[getUserInput(0).decision]} is more convincing because...`
          : undefined
      }
    />
  </TwoUpPrompt>,

  // 1
  getRemoteData("otherStudentResponse") &&
  getRemoteData("otherStudentResponse").decisionExplanation
    ? <TwoUpPrompt {...twoUpPromptProps}>
        <div>
          <Heading>
            {`This student ${getRemoteData("otherStudentResponse").decision ===
            getUserInput(0).decision
              ? "agreed"
              : "disagreed"}, supporting ${choices[
              getRemoteData("otherStudentResponse").decision
            ]}. Here's their argument:`}
          </Heading>
          <RichEditor
            quotedWork
            data={
              (getRemoteData("otherStudentResponse") || {}).decisionExplanation
            }
          />
          <Paragraph />
          <Heading>
            Read your peer's work carefully, then click Next when you're ready.
          </Heading>
        </div>
      </TwoUpPrompt>
    : <BasePrompt>
        <Heading>One moment...</Heading>
      </BasePrompt>,

  // 2
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {`Here’s your peer's argument in support of ${choices[
        (getRemoteData("otherStudentResponse") || {}).decision
      ]}:`}
    </Heading>
    <RichEditor
      quotedWork
      data={(getRemoteData("otherStudentResponse") || {}).decisionExplanation}
    />
    <Heading>React to your peer's work.</Heading>
    <Paragraph>
      {(getRemoteData("otherStudentResponse") || {}).decision ===
      getUserInput(0).decision
        ? "Did they have the same argument as you? Did you use the same evidence? How would you help them improve their work?"
        : "What was their argument? What was their evidence? Imagine taking their side; how would you help improve their work?"}
    </Paragraph>
    <RichEditor
      dataKey="feedback"
      placeholder="The other student argued that…"
    />
  </TwoUpPrompt>,

  // 3
  getRemoteData("_inbox") &&
  extractFeedbackFromInbox(getRemoteData("_inbox")).length > 0
    ? <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          {`Here is what you originally wrote in support of ${choices[
            getUserInput(0).decision
          ]}.`}
        </Heading>
        <RichEditor quotedWork data={getUserInput(0).decisionExplanation} />
        <Heading>
          {`Another student (who originally supported ${choices[
            (getRemoteData("feedback") || {}).decision
          ]}) wrote this in response to your argument:`}
        </Heading>
        <RichEditor
          quotedWork
          data={extractFeedbackFromInbox(getRemoteData("_inbox"))[0].feedback}
        />
        <Heading>Now you can write an improved answer to the question.</Heading>
        <Paragraph>
          Who would you say is more convincing in this dramatization, and why?
        </Paragraph>
        <RichEditor dataKey="revision" />
      </TwoUpPrompt>
    : <BasePrompt>
        <Heading>One moment...</Heading>
      </BasePrompt>,

  // 4
  <BasePrompt>
    <Heading>Thank you!</Heading>
  </BasePrompt>,
];

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  otherStudentResponse: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["userState.furthestPageLoaded", "inputs[0].decision"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async (
      [furthestPageLoaded, decision],
      userID,
      cohort,
      { userState },
    ) => {
      const responseFromStudentData = studentData => {
        // Especially hacky now that we've distinguished pending and submitted data. This whole thing needs to sit behind an abstraction layer.
        if (!studentData) {
          return undefined;
        }
        const firstModuleData = studentData.inputs.submitted
          ? studentData.inputs.submitted[0]
          : studentData.inputs[0];
        return {
          decision: firstModuleData.decision,
          decisionExplanation: firstModuleData.decisionExplanation,
        };
      };

      if (userState && userState.otherStudentResponseUserID) {
        const otherStudentData = await loadData(
          flowName,
          cohort,
          userState.otherStudentResponseUserID,
        );
        return responseFromStudentData(otherStudentData);
      }

      // Don't assign them another student's response until they've reached the page where that's necessary.
      if (userState.furthestPageLoaded < 1) {
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

          if (!otherResponse.inputs || !otherResponse.inputs.submitted) {
            console.log(
              `Filtering out ${userID} because they don't have data submitted`,
            );
            return false;
          }

          if (
            otherResponse.userState.shownToUserID &&
            !otherResponse.userState.isFallbackUser
          ) {
            console.log(
              `Filtering out ${otherUserID} because they have already been shown to ${otherResponse
                .userState.shownToUserID}`,
            );
            return false;
          }

          return true;
        });

        // Order them by disagreeing, then agreeing.
        allValidUserIDs.sort((a, b) => {
          console.log(a, b);
          const aAgrees =
            otherStudentResponses[a].inputs.submitted[0].decision === decision;
          const bAgrees =
            otherStudentResponses[b].inputs.submitted[0].decision === decision;
          if ((aAgrees && bAgrees) || (!aAgrees && !bAgrees)) {
            // Fallback users always come last.
            const aIsFallback =
              otherStudentResponses[a].userState.isFallbackUser;
            const bIsFallback =
              otherStudentResponses[b].userState.isFallbackUser;
            if (!aIsFallback && bIsFallback) {
              return -1;
            } else if (aIsFallback && !bIsFallback) {
              return 1;
            } else {
              return 0;
            }
          } else if (aAgrees && !bAgrees) {
            return 1;
          } else if (!aAgrees && bAgrees) {
            return -1;
          }
        });
        console.log("All valid user IDs", allValidUserIDs);

        let capturedStudentID = null;
        let capturedStudentData = null;
        while (!capturedStudentID && allValidUserIDs.length > 0) {
          const prospectiveStudentID = allValidUserIDs.shift();

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
              !otherStudentData.userState.isFallbackUser &&
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
            capturedStudentData = responseFromStudentData(otherStudentData);
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
          throw new Error(
            `You need to make dummy data in support of decision ${decision}!`,
          );
        } else {
          // TODO(andy): Oh, crap, if we get to this state, there's not actually going to be any feedback for this student. Oh, well.
          throw new Error(`Failed to capture a user.`);
        }
      }
    },
  },

  // TODO(andy): Right now, the feedback itself is delivered via the inbox mechanism, but we have to do this out-of-band fetch to get the other student's position. Can we integrate that into the inbox somehow?
  feedback: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["inbox"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: async ([inbox], userID, cohort, { userState }) => {
      if (!inbox || extractFeedbackFromInbox(inbox).length < 1) {
        return undefined;
      }

      const firstFeedback = extractFeedbackFromInbox(inbox)[0];

      const otherStudentData = await loadData(
        flowName,
        cohort,
        firstFeedback.fromUserID,
      );
      if (!otherStudentData || !otherStudentData.inputs) {
        return undefined;
      }

      return {
        decision: otherStudentData.inputs[0].decision,
      };
    },
  },
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
};
