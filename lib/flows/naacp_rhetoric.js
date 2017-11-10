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

const flowName = "naacp_rhetoric";

const passage = (
  <div>
    <Heading>
      Letter A: First Lady of the United States to Walter White, Executive
      Secretary of the NAACP, addressing the lynching situation.
    </Heading>
    <Paragraph>
      “Before I received your letter today I had been in to the President… and
      he said the difficulty is that it is unconstitutional apparently for the
      Federal Government to step in in the lynching situation… The President
      feels that lynching is a question of education in the states, rallying
      good citizens, and creating public opinion so that the localities
      themselves will wipe it out. However, if it were done by a Northerner, it
      will have an antagonistic effect… I am deeply troubled about the whole
      situation as it seems to be a terrible thing to stand by and let it
      continue… I think your next step would be to talk to the more prominent
      members of the Senate.”
    </Paragraph>
    <Heading>
      Letter B: Daisy Bates to Roy Wilkins, Executive Secretary of the NAACP,
      describing the conditions of black children in a previously all-white
      school.
    </Heading>
    <Paragraph>
      “Conditions are yet pretty rough in the school for the children… The
      treatment of the children had been getting steadily worse for the last two
      weeks in the form of kicking, spitting, and general abuse. As a result of
      our visit, stronger measures are being taken against the white students
      who are guilty of committing these offenses… [The President of the United
      States] was very much concerned about the crisis… He has stated his
      willingness to come down and address the student body if invited by
      student leaders of the school… Last Friday, the 13th, I was asked to call
      Washington and see if we could get FBI men placed in the school.”
    </Paragraph>
    <Paragraph>
      This material adapted from [Beyond the
      Bubble](https://beyondthebubble.stanford.edu/assessments/civil-rights-movement-context)
      per [their CC BY-NC 3.0
      license](https://creativecommons.org/licenses/by-nc/3.0/).
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: passage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on several screens.
const choices = ["Letter A", "Letter B"];

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const findStudentFeedback = (getUserInput, inbox, agreeing) => {
  if (!inbox) {
    return undefined;
  }

  const decision = getUserInput(0).decision;
  return extractFeedbackFromInbox(inbox).find(
    message => agreeing === (decision === message.submitted[0].decision),
  );
};

const waitForMatchingModule = (
  <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
    <Heading>Matching you with a partner. One moment...</Heading>
  </TwoUpPrompt>
);

const waitForFeedbackModule = (
  <BasePrompt {...twoUpPromptProps} blockNextButton>
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
    <TwoUpPrompt {...twoUpPromptProps}>
      <Paragraph hideInReport>
        The following two letters are both from the archives of the National
        Association for the Advancement of Colored People (NAACP) and were
        written over **twenty years apart**. Read the letters and determine
        which was written first. Then explain your answers using evidence from
        the letters and your knowledge of history.
      </Paragraph>
      <MultipleChoice
        dataKey="decision"
        choices={choices.map(c => `${c} was likely written first.`)}
      />
      <RichEditor
        dataKey="decisionExplanation"
        placeholder={
          decision !== undefined
            ? `${choices[decision]} was likely written first because...`
            : undefined
        }
      />
    </TwoUpPrompt>
  );

  if (reviewees && reviewees.responses[0]) {
    const revieweeResponse = reviewees.responses[0];

    modules[1] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          {`This peer of yours disagreed, arguing that ${choices[
            revieweeResponse.decision
          ]} came first.`}
        </Heading>
        <ResponseQuote
          data={revieweeResponse.decisionExplanation}
          showsRejectionButton={revieweeResponse._rejectable}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          {`Read your peer's paragraph. Explain in 2–5 sentences why your peer believes ${choices[
            revieweeResponse.decision
          ]} came first.`}
        </Heading>
        <RichEditor dataKey="summary" placeholder="This student argued that…" />
      </TwoUpPrompt>
    );

    modules[2] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading hideInReport>
          {`This peer of yours disagreed, arguing that ${choices[
            revieweeResponse.decision
          ]} came first.`}
        </Heading>
        <ResponseQuote
          hideInReport
          data={revieweeResponse.decisionExplanation}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          How much were you persuaded by their response? What made it persuasive
          or unpersuasive?
        </Heading>
        <LikertChoice
          dataKey="reviewee1ChangeMind"
          leftLabel="Not at all"
          rightLabel="Completely"
        />
        <RichEditor
          dataKey="feedback"
          placeholder={
            getUserInput(2).reviewee1ChangeMind === undefined
              ? ""
              : `This student's answer ${getUserInput(2).reviewee1ChangeMind < 2
                  ? "did not change my mind"
                  : "changed my mind"} because…`
          }
        />
      </TwoUpPrompt>
    );
  } else {
    modules[1] = waitForMatchingModule;
    modules[2] = waitForMatchingModule;
  }

  // 3
  if (reviewees && reviewees.responses[1]) {
    const revieweeResponse = reviewees.responses[1];

    modules[3] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          {`This second peer of yours agreed that ${choices[
            revieweeResponse.decision
          ]} came first.`}
        </Heading>
        <ResponseQuote
          data={revieweeResponse.decisionExplanation}
          showsRejectionButton={revieweeResponse._rejectable}
          dispatcher={dispatcher}
          revieweeIndex={1}
        />
        <Heading>
          {`Read your peer's paragraph. Explain in 2–5 sentences why your peer believes ${choices[
            revieweeResponse.decision
          ]} came first.`}
        </Heading>
        <RichEditor dataKey="summary" placeholder="This student argued that…" />
      </TwoUpPrompt>
    );

    modules[4] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          Without changing any of the evidence they cited, help your peer make
          their argument more persuasive by editing or adding to their answer
          below.
        </Heading>
        <RichEditor
          dataKey="feedback"
          initialData={revieweeResponse.decisionExplanation}
          diffBase={revieweeResponse.decisionExplanation}
        />
      </TwoUpPrompt>
    );
  } else {
    modules[3] = waitForMatchingModule;
    modules[4] = waitForMatchingModule;
  }

  modules[5] = (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading hideInReport>
        {`${decision === 0
          ? "Just like you thought"
          : "Unlike as you initially thought"}, letter A was written first.`}
      </Heading>
      <Heading>
        What tips and strategies did you learn from editing your peer's work?
        Based on what you've learned in the last few pages, revise your answer
        to make it more persuasive.
      </Heading>
      <RichEditor
        dataKey="preFeedbackRevision"
        initialData={getUserInput(0).decisionExplanation}
        diffBase={getUserInput(0).decisionExplanation}
      />
    </TwoUpPrompt>
  );

  if (feedback) {
    modules[6] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>We've got feedback for you!</Heading>
        <Heading hideInReport>
          Here's your most recent response, for reference:
        </Heading>
        <RichEditor
          hideInReport
          data={getUserInput(5).preFeedbackRevision}
          quotedWork
        />
        <Heading>
          A peer of yours who agreed with you read your answer and summarized
          it:
        </Heading>
        <RichEditor
          data={feedback.submitted[feedback.fromModuleID - 1].summary}
          quotedWork
        />
        <Heading>Read and reflect: is this what you intended?</Heading>
        <RichEditor
          dataKey="reflection"
          placeholder="It seems like maybe my second point wasn't clear…"
        />
      </TwoUpPrompt>
    );

    modules[7] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          That same peer edited your revised response to make it more
          persuasive:
        </Heading>
        <RichEditor
          data={feedback.feedback}
          diffBase={getUserInput(5).preFeedbackRevision}
          quotedWork
        />
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
      </TwoUpPrompt>
    );

    modules[8] = (
      <TwoUpPrompt {...twoUpPromptProps}>
        <Heading hideInReport>Here are your peer's edits:</Heading>
        <RichEditor
          hideInReport
          data={
            findStudentFeedback(getUserInput, getRemoteData("_inbox"), true)
              .feedback
          }
          diffBase={getUserInput(5).preFeedbackRevision}
          quotedWork
        />
        <Heading>
          Based on your peer's edits and what you've learned in this activity,
          revise your original response for a final submission:
        </Heading>
        <RichEditor
          dataKey="finalDraft"
          initialData={getUserInput(5).preFeedbackRevision}
          diffBase={getUserInput(5).preFeedbackRevision}
        />
      </TwoUpPrompt>
    );
  } else {
    modules[6] = waitForFeedbackModule;
    modules[7] = waitForFeedbackModule;
    modules[8] = waitForFeedbackModule;
  }

  modules[9] = (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Paragraph>
        Think about what you learned in this activity. What skills might you
        want to focus on developing as you keep learning?
      </Paragraph>
      <Heading>Clarity of communication</Heading>
      <LikertChoice
        dataKey="clarity"
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
      />
      <Heading>Persuasive writing</Heading>
      <LikertChoice
        dataKey="persuasiveWriting"
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
      />
      <Heading>Historical thinking</Heading>
      <LikertChoice
        dataKey="historicalThinking"
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
      />
      <Heading>Structuring an argument</Heading>
      <LikertChoice
        dataKey="structuring"
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
      />
      <Heading>Knowledge of this subject</Heading>
      <LikertChoice
        dataKey="subjectKnowledge"
        leftLabel="I'm strong on this"
        rightLabel="I'll work on this"
      />

      <Heading>What's your plan moving forward?</Heading>
      <RichEditor
        dataKey="reflection"
        placeholder="I learned a lot about clarity through… but I still need to focus on historical thinking because…"
      />
    </TwoUpPrompt>
  );

  modules[10] = (
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

const pageForReview = 5;

const remoteDataRequirements = {
  reviewees: revieweeRequirement({
    flowName,
    extractResponse: data => ({
      decision: data[0].decision,
      decisionExplanation: data[pageForReview].preFeedbackRevision,
    }),
    matchAtPageNumber: 1,
    revieweePageNumberRequirement: pageForReview,
    sortReviewees: (submittedUserInputs, responseA, responseB) => {
      // Put disagreeing users before agreeing users
      const userDecision = submittedUserInputs[0].decision;
      const aAgrees = responseA.inputs.submitted[0].decision === userDecision;
      const bAgrees = responseB.inputs.submitted[0].decision === userDecision;
      if (aAgrees && !bAgrees) {
        return 1;
      } else if (!aAgrees && bAgrees) {
        return -1;
      } else {
        return 0;
      }
    },
    findReviewees: (submittedUserInputs, captureStudentMatching) => {
      const userDecision = submittedUserInputs[0].decision;
      return [
        // First, one that disagrees...
        captureStudentMatching(
          otherUserData =>
            otherUserData.inputs.submitted[0].decision !== userDecision,
        ),
        // Then one that agrees.
        captureStudentMatching(
          otherUserData =>
            otherUserData.inputs.submitted[0].decision === userDecision,
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
