import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RejectResponseButton from "../components/reject-response-button"; // TODO remove
import ResponseQuote from "../components/response-quote";
import revieweeRequirement from "./utilities/reviewee-requirement";
import RichEditor from "../components/rich-editor";
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "compare_napoleon";

const flipGroup = group => {
  if (group == "louis") {
    return "peter";
  } else if (group == "peter") {
    return "louis";
  }
};

// I've extracted these so that I can display the same text on several screens.
const choices = { louis: "Louis XIV", peter: "Peter the Great" };

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
  return extractFeedbackFromInbox(inbox)[0];
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
      Great work! Take a moment to think about everything you've learned in this
      exercise. You'll also get feedback on your final piece of writing from
      another student shortly, giving you the opportunity to keep learning!
    </Paragraph>
    <Paragraph>
      This page will automatically refresh to show their feedback when it's
      available. You'll also receive an email with a link back to here when your
      feedback is ready.
    </Paragraph>
  </BasePrompt>
);

const modules = (getUserInput, getRemoteData, dispatcher) => {
  let modules = [];

  const decision = getUserInput(0).decision;
  const reviewees = getRemoteData("reviewees");
  const feedbackInbox = getRemoteData("_inbox");
  const feedback = findStudentFeedback(getUserInput, feedbackInbox, true);

  modules[0] = (
    <BasePrompt>
      <Paragraph hideInReport>
        {`Compare and contrast the rule of Napoleon with the rule of ${choices[
          getRemoteData("group")
        ]}.`}
      </Paragraph>
      <Paragraph hideInReport>3 Similarities:</Paragraph>
      <RichEditor dataKey="similarities" placeholder={"1. First Similarity"} />
      <Paragraph hideInReport>3 Differences:</Paragraph>
      <RichEditor dataKey="differences" placeholder={"1. First Difference"} />
    </BasePrompt>
  );

  if (reviewees.responses && reviewees.responses[0]) {
    const revieweeResponse = reviewees.responses[0];

    modules[1] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            {" "}
            <Heading>Your similarities:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Heading>Your differences:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
          </div>
        }
      >
        <Heading>
          {`Here are the similarities and differences your peer noticed between Napoleon and a different ruler, ${choices[
            flipGroup(getRemoteData("group"))
          ]} came first.`}
        </Heading>
        <Paragraph>Similarities:</Paragraph>
        <ResponseQuote
          data={revieweeResponse.similarities}
          showsRejectionButton={false}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Paragraph>Differences:</Paragraph>
        <ResponseQuote
          data={revieweeResponse.differences}
          showsRejectionButton={revieweeResponse._rejectable}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          {`What similarities do you notice in the comparisons between these rulers? If you don't see any comparisons, what might one be? Are there important differences? Explain in 2–5 sentences.`}
        </Heading>
        <RichEditor dataKey="compareWithPeer" placeholder="I notice that..." />
      </TwoUpPrompt>
    );

    modules[2] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            {" "}
            <Heading>Your similarities:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Heading>Your differences:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph>Similarities:</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph>Differences:</Paragraph>
            <ResponseQuote
              data={revieweeResponse.differences}
              showsRejectionButton={revieweeResponse._rejectable}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
          </div>
        }
      >
        <Heading hideInReport>
          Based on the work you've just done, how would you say absolutism was
          relevant to the French Revolution?
        </Heading>

        <RichEditor
          dataKey="summary"
          placeholder={
            "Based on the rules of Napoleon, Peter the Great, and Louis XIV..."
          }
        />
      </TwoUpPrompt>
    );

    modules[3] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>Your similarities:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Heading>Your differences:</Heading>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph>Similarities:</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph>Differences:</Paragraph>
            <ResponseQuote
              data={revieweeResponse.differences}
              showsRejectionButton={revieweeResponse._rejectable}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
          </div>
        }
      >
        <Heading>
          Here's how your peer answered the same question. Try to improve it in
          some way.
        </Heading>
        <RichEditor
          dataKey="feedback"
          initialData={revieweeResponse.summary}
          diffBase={revieweeResponse.summary}
        />
      </TwoUpPrompt>
    );
  } else {
    modules[1] = waitForMatchingModule;
    modules[2] = waitForMatchingModule;
    modules[3] = waitForMatchingModule;
  }

  if (feedback) {
    modules[4] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading hideInReport>
              Here's your most recent response, for reference:
            </Heading>
            <RichEditor
              hideInReport
              data={getUserInput(2).summary}
              quotedWork
            />
            <Heading>A peer of yours changed it:</Heading>
            <RichEditor
              data={feedback.feedback}
              diffBase={getUserInput(2).summary}
              quotedWork
            />
          </div>
        }
      >
        <Heading>We've got feedback for you!</Heading>
        <Heading>What did they change?</Heading>
        <RichEditor
          dataKey="changeAnalysis"
          placeholder="I noticed that they added…"
          minHeight="3em"
        />
        <Heading>
          Why do you think they changed it? What effect did it have on your
          work?
        </Heading>
        <RichEditor
          dataKey="changeAnalysis2"
          placeholder="I think they were trying to improve… which strengthens my argument's…"
          minHeight="3em"
        />
        <Heading>
          Based on your peer's edits and what you've learned in this activity,
          revise your original response for a final submission:
        </Heading>
        <RichEditor
          dataKey="finalDraft"
          initialData={getUserInput(2).summary}
          diffBase={getUserInput(2).summary}
        />
      </TwoUpPrompt>
    );
  } else {
    modules[4] = waitForFeedbackModule;
  }

  modules[5] = (
    <BasePrompt>
      <Heading>You're all done!</Heading>
      <Paragraph>
        Take a look at how far you've come. Here's your first draft:
      </Paragraph>
      <RichEditor data={getUserInput(0).decisionExplanation} quotedWork />
      <Paragraph>
        Here's your second draft, after seeing peer work but before receiving
        feedback:
      </Paragraph>
      <RichEditor
        data={getUserInput(5).preFeedbackRevision}
        diffBase={getUserInput(0).decisionExplanation}
        quotedWork
      />
      <Paragraph>And here's your final draft:</Paragraph>
      <RichEditor
        data={getUserInput(8).finalDraft}
        diffBase={getUserInput(5).preFeedbackRevision}
        quotedWork
      />
      <Paragraph>
        You reflected on what you learned and made plans for what you wanted to
        work on next:
      </Paragraph>

      <Heading>Clarity of communication</Heading>
      <LikertChoice
        data={getUserInput(9).clarity}
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
        editable={false}
      />
      <Heading>Persuasive writing</Heading>
      <LikertChoice
        data={getUserInput(9).persuasiveWriting}
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
        editable={false}
      />
      <Heading>Historical thinking</Heading>
      <LikertChoice
        data={getUserInput(9).historicalThinking}
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
        editable={false}
      />
      <Heading>Structuring an argument</Heading>
      <LikertChoice
        data={getUserInput(9).structuring}
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
        editable={false}
      />
      <Heading>Knowledge of this subject</Heading>
      <LikertChoice
        data={getUserInput(9).subjectKnowledge}
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
        editable={false}
      />
      <RichEditor data={getUserInput(9).reflection} quotedWork />
    </BasePrompt>
  );

  return modules;
};

const remoteDataRequirements = {
  group: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: (
      [furthestPageLoaded],
      userID,
      cohort,
      { inputs, userState },
      inManagerInterface,
    ) => {
      if (inManagerInterface) {
        return undefined;
      }
      if (userState.group) {
        return {
          remoteData: userState.group,
        };
      }
      let group = Math.random();

      if (group >= 0.5) {
        group = "louis";
      } else {
        group = "peter";
      }
      return {
        remoteData: group,
        newUserState: {
          group,
        },
      };
    },
  },

  reviewees: revieweeRequirement({
    flowName,
    extractResponse: data => ({
      similarities: data[0].similarities,
      differences: data[0].differences,
      summary: data[2].summary,
    }),
    matchAtPageNumber: 1,
    revieweePageNumberRequirement: 0,
    // TODO: Needs updating for the summary paragraph
    sortReviewees: (submittedUserInputs, responseA, responseB) => {
      return 0;
    },
    findReviewees: ({ inputs, userState }, captureStudentMatching) => {
      const userGroup = userState.group;
      return [
        // First, one that disagrees...
        captureStudentMatching(
          otherUserData =>
            otherUserData.userState.group !== userGroup &&
            otherUserData.inputs.submitted[2],
        ),
      ];
    },
  }),
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, [1, 2], [3, 4], 5, [6, 7], [8, 9]],
};
