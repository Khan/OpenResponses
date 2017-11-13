import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
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

  const rulerName = choices[getRemoteData("group")];

  modules[0] = (
    <TwoUpPrompt
      referenceComponent={
        <div>
          <Image path="compare_napoleon/napoleon.jpg" />
        </div>
      }
    >
      <Heading hideInReport>
        In this activity, we'll be comparing and contrasting the rule of
        Napoleon with absolutist monarchs.
      </Heading>
      <Paragraph hideInReport>
        {`To get started, brainstorm at least three *similarities* between the reign of Napoleon and the reign of ${rulerName}.`}
      </Paragraph>
      <RichEditor dataKey="similarities" placeholder={"1. First similarity…"} />
      <Paragraph hideInReport>
        {`Now brainstorm at least three *differences* between the reign of Napoleon and the reign of ${rulerName}.`}
      </Paragraph>
      <RichEditor dataKey="differences" placeholder={"1. First difference"} />
    </TwoUpPrompt>
  );

  if (reviewees.responses && reviewees.responses[0]) {
    const revieweeResponse = reviewees.responses[0];

    const revieweeRulerName = choices[flipGroup(getRemoteData("group"))];

    modules[1] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>Your comparisons, for reference.</Heading>
            <Paragraph
            >{`Your similarities between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph
            >{`Your differences between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
          </div>
        }
      >
        <Heading>
          {`Now we'll look at the comparisons one of your classmates noticed between Napoleon and a different absolutist ruler, *${revieweeRulerName}*.`}
        </Heading>
        <Paragraph
        >{`Their similarities between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
        <ResponseQuote
          data={revieweeResponse.similarities}
          showsRejectionButton={false}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Paragraph
        >{`Their differences between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
        <ResponseQuote
          data={revieweeResponse.differences}
          showsRejectionButton={revieweeResponse._rejectable}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          What similarities do you notice in the comparisons between these pairs
          of rulers? (If you don't see any, what might one be?)
        </Heading>
        <Heading>
          Are there important differences? Explain in 2–5 sentences.
        </Heading>
        <RichEditor dataKey="compareWithPeer" placeholder="I notice that..." />
      </TwoUpPrompt>
    );

    modules[2] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>
              Your and your classmate's comparisons, for reference.
            </Heading>
            <Paragraph
            >{`Your similarities between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph
            >{`Your differences between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph
            >{`Their similarities between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph
            >{`Their differences between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
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
          Now compare and contrast absolutist monarchy more generally with
          Napoleonic rule.
        </Heading>
        <Heading>
          Focus on the most significant similarities and differences you and
          your peer have identified. Use 2–5 sentences.
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
            <Heading>
              Your and your classmate's comparisons, for reference.
            </Heading>
            <Paragraph
            >{`Your similarities between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph
            >{`Your differences between the reigns of Napoleon and *${rulerName}*:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph
            >{`Their similarities between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph
            >{`Their differences between the reigns of Napoleon and *${revieweeRulerName}*:`}</Paragraph>
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
          Here's how your peer answered the prompt on the last page.
        </Heading>
        <RichEditor data={revieweeResponse.summary} quotedWork />
        <Heading>
          What feedback do you have for your peer? Here are a few prompts you
          might reflect on:
        </Heading>
        <Paragraph>
          {`• Did your peer suggest any ideas that were new to you?
          • What was the most effective part of their answer?
          • Could some part of their argument be left out?
          • What question does this answer prompt you to ask?`}
        </Paragraph>
        <RichEditor dataKey="highLevelFeedback" placeholder="I noticed that…" />
        <Heading>
          Based on your feedback above, strengthen your peer's response:
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
            <Heading>
              For reference, the prompt was: compare and contrast absolutist
              monarchy with Napoleonic rule.
            </Heading>
            <Paragraph>Your response was:</Paragraph>
            <RichEditor data={getUserInput(2).summary} quotedWork />
            <Paragraph>A peer of yours left you this feedback:</Paragraph>
            <RichEditor
              data={feedback.submitted[3].highLevelFeedback}
              quotedWork
            />
            <Paragraph>They made these edits to your response:</Paragraph>
            <RichEditor
              data={feedback.feedback}
              diffBase={getUserInput(2).summary}
              quotedWork
            />
          </div>
        }
      >
        <Heading>
          Another peer has left you feedback (on the left side of the screen).
        </Heading>
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
      <RichEditor data={getUserInput(2).summary} quotedWork />
      <Paragraph>
        And your second draft, after seeing your peer's edits:
      </Paragraph>
      <RichEditor
        data={getUserInput(4).finalDraft}
        diffBase={getUserInput(2).summary}
        quotedWork
      />
      <Paragraph>
        This activity was an experiment by Khan Academy. We're trying to make
        them better! Please help us by answering a few questions below:
      </Paragraph>
      <iframe
        src={`https://khanacademy.typeform.com/to/KINOmf${document.location.search
          .replace("flowID", "flowid")
          .replace("classCode", "classcode")
          .replace("userID", "userid")}`}
        style={{
          width: "100%",
          height: "600px",
          borderRadius: styles.borderRadius,
          padding: styles.borderRadius / 2,
          ...styles.hairlineBorderStyle,
        }}
      />
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
