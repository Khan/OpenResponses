import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RejectResponseButton from "../components/reject-response-button"; // TODO remove
import ResponseQuote from "../components/response-quote";
import RichEditor from "../components/rich-editor";
import SelectAllThatApply from "../components/select-all-that-apply";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "tiltedSquare_async";

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const modules = (getUserInput, getRemoteData, dispatcher) => [
  // 0
  <BasePrompt>
    <Heading>
      You will see a few solutions to this problem: find the area of the tilted
      square.
    </Heading>
    <Image path="tiltedSquare/2-by-3-square.png" />
  </BasePrompt>,

  // 1
  <TwoUpPrompt
    referenceComponent={<Image path="tiltedSquare/solutions-1-of-3.png" />}
  >
    <Paragraph>
      Jason showed the solution at left for finding the area of the tilted
      square.
    </Paragraph>
    <Heading>Do you see how he did it?</Heading>
    <MultipleChoice
      dataKey="seeHowJasonDidIt"
      choices={["I think I understand his method.", "I'm not sure yet."]}
    />
  </TwoUpPrompt>,

  // 2
  <TwoUpPrompt
    referenceComponent={<Image path="tiltedSquare/solutions-2-of-3.png" />}
  >
    <Paragraph>We've added another method that might be helpful.</Paragraph>
    <Heading>
      Write 2–3 observations about the similarities and differences between
      Jason's and Kate's methods.
    </Heading>
    <RichEditor
      dataKey="jasonKateObservations"
      placeholder="Jason says this and Kate says that."
    />
    <Heading>What questions do you have about these methods?</Heading>
    <RichEditor dataKey="jasonKateQuestions" placeholder="Why fly sly guy?" />
  </TwoUpPrompt>,

  // 3
  getRemoteData("reviewees") && getRemoteData("reviewees").responses
    ? <TwoUpPrompt
        referenceComponent={<Image path="tiltedSquare/solutions-2-of-3.png" />}
      >
        <Paragraph>Another student wrote this about the two methods:</Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[0].jasonKateObservations}
          showsRejectionButton={
            getRemoteData("reviewees").responses[0]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Paragraph>But they had these questions:</Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[0].jasonKateQuestions}
          showsRejectionButton={
            getRemoteData("reviewees").responses[0]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          Write at least two sentences that build on the other student's
          observations, and help answer their questions.
        </Heading>
        <RichEditor dataKey="feedback" />
      </TwoUpPrompt>
    : <TwoUpPrompt
        referenceComponent={<Image path="tiltedSquare/solutions-2-of-3.png" />}
        blockNextButton
      >
        <Heading>Matching you with a partner. One moment...</Heading>
      </TwoUpPrompt>,

  // 4
  getRemoteData("_inbox") &&
  extractFeedbackFromInbox(getRemoteData("_inbox")).length > 0
    ? <TwoUpPrompt
        referenceComponent={<Image path="tiltedSquare/solutions-2-of-3.png" />}
      >
        <Paragraph>This was your original analysis:</Paragraph>
        <RichEditor data={getUserInput(2).jasonKateObservations} quotedWork />
        <Paragraph>And you had this question:</Paragraph>
        <RichEditor data={getUserInput(2).jasonKateQuestions} quotedWork />
        <Paragraph>
          Another student wrote this in response to your writing:
        </Paragraph>
        <RichEditor
          data={extractFeedbackFromInbox(getRemoteData("_inbox"))[0].feedback}
          quotedWork
        />
        <Heading>
          Did you get any new ideas from your peer? Check any that apply:
        </Heading>
        <SelectAllThatApply
          choices={[
            "I got new ideas.",
            "I was reminded of ideas I already knew.",
            "I got help with my questions.",
            "I did not feel the response was helpful.",
          ]}
          dataKey="feedbackOnFeedback"
        />
      </TwoUpPrompt>
    : <BasePrompt blockNextButton>
        <Heading>You'll get a response from a peer shortly!</Heading>
        <Paragraph>
          Another student will soon see your work and send you a response.
        </Paragraph>
        <Paragraph>
          This page will automatically refresh to show their feedback when it's
          available. You'll also receive an email with a link back to here when
          your feedback is ready.
        </Paragraph>
      </BasePrompt>,

  // 5
  <TwoUpPrompt
    referenceComponent={<Image path="tiltedSquare/solutions-3-of-3.png" />}
  >
    <Paragraph>Now consider one more method: Simon’s.</Paragraph>
    <Paragraph>
      Do you believe Simon’s claim that the area inside the bold line is the
      same as the area of the tilted square?
    </Paragraph>
    <MultipleChoice
      dataKey="believeSimon"
      choices={[
        "Yes, I believe Simon's claim.",
        "I haven't decided yet.",
        "No, I don't believe his claim.",
      ]}
    />
  </TwoUpPrompt>,

  // 6
  <TwoUpPrompt
    referenceComponent={<Image path="tiltedSquare/solutions-3-of-3.png" />}
  >
    <Paragraph>
      Help support Simon’s claim by writing a better explanation of his method.
      You may use ideas from Jason and Kate.
    </Paragraph>
    <Heading>Write 3+ sentences.</Heading>
    <RichEditor dataKey="explainSimon" />
  </TwoUpPrompt>,

  // 7
  <BasePrompt>
    <Heading>Thank you!</Heading>
  </BasePrompt>,
];

const maximumTimesResponseShown = 2;
const numberOfReviewees = 1;

const revieweeFetcher = async (
  [furthestPageLoaded, pendingRejections],
  userID,
  cohort,
  { userState },
) => {
  const responseFromStudentData = studentData => {
    // Especially hacky now that we've distinguished pending and submitted data. This whole thing needs to sit behind an abstraction layer.
    if (!studentData) {
      return undefined;
    }
    const moduleData = studentData.inputs.submitted
      ? studentData.inputs.submitted[2]
      : studentData.inputs[2];
    const { jasonKateQuestions, jasonKateObservations } = moduleData;
    return { jasonKateQuestions, jasonKateObservations };
  };

  const responsesFromRevieweeStructures = reviewees => {
    return {
      responses: Object.keys(reviewees).sort().map(key => ({
        ...reviewees[key].submission,
        _rejectable: reviewees[key].rejectable,
      })),
    };
  };

  const isRejectedReviewee = revieweeUserID => {
    return Object.values(pendingRejections || {}).find(
      rejection => rejection === revieweeUserID,
    );
  };

  const reviewees = Object.keys(userState.reviewees || {})
    .sort()
    .map(rk => userState.reviewees[rk])
    .filter(reviewee => !isRejectedReviewee(reviewee.userID));
  if (reviewees.length === numberOfReviewees) {
    return responsesFromRevieweeStructures(reviewees);
  }

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < 1) {
    return undefined;
  } else if (reviewees.length < numberOfReviewees) {
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
          `Filtering out ${otherUserID} because they don't have user state`,
        );
        return false;
      }

      if (
        !otherResponse.inputs ||
        !otherResponse.inputs.submitted ||
        !otherResponse.inputs.submitted[2]
      ) {
        console.log(
          `Filtering out ${otherUserID} because they don't have data submitted`,
        );
        return false;
      }

      if (
        otherResponse.userState.reviewerCount >= maximumTimesResponseShown &&
        !otherResponse.userState.isFallbackUser
      ) {
        console.log(
          `Filtering out ${otherUserID} because they have already been shown to ${otherResponse
            .userState.reviewerCount} reviewers`,
        );
        return false;
      }

      if (isRejectedReviewee(otherUserID)) {
        console.log(
          `Filtering out ${otherUserID} because they've been rejected by the current user.`,
        );
        return false;
      }

      if (reviewees.find(r => r.userID === otherUserID)) {
        console.log(
          `Filtering out ${otherUserID} because they're already a reviewee.`,
        );
        return false;
      }

      return true;
    });

    // Now we'll sort these possible user IDs according to our policy about how work should be distributed.
    allValidUserIDs.sort((a, b) => {
      const aUserState = otherStudentResponses[a].userState;
      const bUserState = otherStudentResponses[b].userState;

      // Fallback users always come last.
      if (!aUserState.isFallbackUser && bUserState.isFallbackUser) {
        return -1;
      } else if (aUserState.isFallbackUser && !bUserState.isFallbackUser) {
        return 1;
      } else {
        // Has one of these users been reviewed less than another?
        if (aUserState.reviewerCount < bUserState.reviewerCount) {
          return -1;
        } else if (aUserState.reviewerCount > bUserState.reviewerCount) {
          return 1;
        } else {
          // TODO: randomize within groups
          return 0;
        }
      }
    });
    console.log("All valid user IDs", allValidUserIDs);

    while (reviewees.length < numberOfReviewees && allValidUserIDs.length > 0) {
      const prospectiveStudentID = allValidUserIDs.shift();

      const otherStudentRef = _getDatabase().ref(
        `${flowName}/${cohort}/${prospectiveStudentID}`,
      );
      console.log("Attempting to capture student ", prospectiveStudentID);
      const {
        committed,
        snapshot,
      } = await otherStudentRef.transaction(otherStudentData => {
        const oldReviewerCount =
          (otherStudentData &&
            otherStudentData.userState &&
            otherStudentData.userState.reviewerCount) ||
          0;
        if (
          oldReviewerCount >= maximumTimesResponseShown &&
          !otherStudentData.userState.isFallbackUser
        ) {
          console.error(
            `${prospectiveStudentID} was captured too many times by others: race condition`,
          );
          return undefined;
        }
        return {
          ...otherStudentData,
          userState: {
            ...(otherStudentData && otherStudentData.userState),
            reviewerCount: oldReviewerCount + 1,
          },
        };
      });
      if (committed) {
        const capturedStudentID = prospectiveStudentID;
        const otherStudentData = snapshot.val();
        const capturedStudentData = responseFromStudentData(otherStudentData);
        console.log(
          "Captured student ",
          capturedStudentID,
          capturedStudentData,
        );
        reviewees.push({
          userID: capturedStudentID,
          submission: capturedStudentData,
          rejectable: !otherStudentData.userState.isFallbackUser,
        });
      }
    }

    if (reviewees.length === numberOfReviewees) {
      return {
        remoteData: responsesFromRevieweeStructures(reviewees),
        newUserState: {
          reviewees: reviewees,
          pendingRejections: {},
        },
      };
    } else if (allValidUserIDs.length < numberOfReviewees) {
      throw new Error(`You need to make more dummy data.`);
    } else {
      throw new Error(`Failed to capture a user.`);
    }
  }
};

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
const remoteDataRequirements = {
  reviewees: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: ["userState.furthestPageLoaded", "userState.pendingRejections"],
    // Given the student's interpretation, find an alternative student response:
    fetcher: revieweeFetcher,
  },
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
};
