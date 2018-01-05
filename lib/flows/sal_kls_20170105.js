import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import ResponseQuote from "../components/response-quote";
import revieweeRequirement from "./utilities/reviewee-requirement";
import RichEditor from "../components/rich-editor";
import SelectAllThatApply from "../components/select-all-that-apply";
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "sal_kls_20170105";

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const findStudentFeedback = (getUserInput, inbox) => {
  if (!inbox) {
    return undefined;
  }
  return extractFeedbackFromInbox(inbox);
};

const waitForMatchingModule = (
  <BasePrompt blockNextButton>
    <Heading>Matching you with a partner. One moment...</Heading>
  </BasePrompt>
);

const waitForFeedbackModule = (
  <BasePrompt blockNextButton>
    <Heading>You'll get feedback shortly!</Heading>
    <Paragraph>
      Take a moment to think about what you've learned from looking at other
      students' work. You'll get feedback from other students shortly, so that
      you can keep learning.
    </Paragraph>
    <Paragraph>
      This page will automatically refresh to show their feedback when it's
      available. You'll also receive an email with a link back to here when your
      feedback is ready.
    </Paragraph>
  </BasePrompt>
);

const numberOfReviewees = 3;

const rubricChoices = [
  "Gave a clear answer of opinion on Jesus's intent",
  "Gave a valid backup claim",
  "Gave a second valid backup claim",
];

const modules = (getUserInput, getRemoteData, dispatcher) => {
  let modules = [];

  const reviewees = getRemoteData("reviewees");
  const feedbackInbox = getRemoteData("_inbox");
  const feedback = findStudentFeedback(getUserInput, feedbackInbox);

  modules[0] = (
    <BasePrompt>
      <Paragraph hideInReport>
        Do you think Jesus intended to reform Judaism or start a new religion?
        Give **two reasons** to back your claim.
      </Paragraph>
      <RichEditor
        dataKey="response"
        placeholder={"I think Jesus intended… because…"}
      />
    </BasePrompt>
  );

  for (
    let revieweeIndex = 0;
    revieweeIndex < numberOfReviewees;
    revieweeIndex++
  ) {
    if (
      reviewees &&
      reviewees.responses &&
      reviewees.responses[revieweeIndex]
    ) {
      const thisStudentFeedback =
        getUserInput(1 + revieweeIndex).feedback || [];
      const imperfectScore = thisStudentFeedback.length < 3;
      const scoreSummary = `Total score: ${thisStudentFeedback.length} / 3.`;

      modules[revieweeIndex + 1] = (
        <BasePrompt>
          <Paragraph hideInReport>One of your classmates wrote this:</Paragraph>
          <RichEditor
            data={reviewees.responses[revieweeIndex].response}
            quotedWork
          />
          <Heading>
            Give your classmate feedback by checking all the boxes that apply.
          </Heading>
          <SelectAllThatApply choices={rubricChoices} dataKey="feedback" />
          <Heading>{scoreSummary}</Heading>
          {imperfectScore ? (
            <Paragraph>Please explain why you gave them this score:</Paragraph>
          ) : (
            <div />
          )}
          {imperfectScore ? (
            <RichEditor
              placeholder="I didn't give them a point for a second valid backup claim because…"
              dataKey="explanation"
            />
          ) : (
            <div />
          )}
        </BasePrompt>
      );
    } else {
      modules[revieweeIndex + 1] = waitForMatchingModule;
    }
  }

  if (feedback && feedback.length > 0) {
    const feedbackSubmissions = feedback.map(
      reviewer => reviewer.submitted[reviewer.fromModuleID],
    );
    const scores = feedbackSubmissions.map(
      reviewer => reviewer.feedback.length,
    );
    const sortedScores = [...scores].sort();
    const median = list =>
      list.length % 2 == 0
        ? (list[list.length / 2 - 1] + list[list.length / 2]) / 2
        : list[Math.floor(list.length / 2)];
    const medianScore = median(sortedScores);
    modules[numberOfReviewees + 1] = (
      <BasePrompt>
        <Paragraph hideInReport>
          For reference, the prompt was: do you think Jesus intended to reform
          Judaism or start a new religion?
        </Paragraph>
        <Paragraph hideInReport>Your response was:</Paragraph>
        <RichEditor hideInReport data={getUserInput(0).response} quotedWork />
        <Heading>{`Your median score: ${parseFloat(medianScore).toFixed(
          1,
        )}\n`}</Heading>
        <div>
          {feedbackSubmissions.map((reviewer, index) => (
            <div key={index}>
              <Heading>{`\nReviewer ${index + 1}`}</Heading>
              <SelectAllThatApply
                data={reviewer.feedback}
                choices={rubricChoices}
              />
              {reviewer.explanation ? (
                <RichEditor data={reviewer.explanation} quotedWork />
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </BasePrompt>
    );
  } else {
    modules[numberOfReviewees + 1] = waitForFeedbackModule;
  }

  return modules;
};

const remoteDataRequirements = {
  reviewees: revieweeRequirement({
    flowName,
    extractResponse: data => ({
      response: data[0].response,
    }),
    matchAtPageNumber: 1,
    revieweePageNumberRequirement: 0,
    sortReviewees: (submittedUserInputs, responseA, responseB) => {
      return 0;
    },
    findReviewees: ({ inputs, userState }, captureStudentMatching) => {
      const reviewees = [];
      for (var i = 0; i < numberOfReviewees; i++) {
        reviewees.push(
          captureStudentMatching(
            otherUserData =>
              reviewees.findIndex(
                reviewee => reviewee.userID === otherUserData.userID,
              ) === -1,
          ),
        );
      }
      return reviewees;
    },
  }),
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, 1, 2, 3, 4],
};
