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

const flowName = "compare_colonization";

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
    <TwoUpPrompt
      referenceComponent={
        <div>
          <Image path={`compare_colonization/ship.jpg`} />
        </div>
      }
    >
      <Heading hideInReport>
        In this activity, we'll be exploring how Spain and Portugal approached
        overseas territories during the 15th and 16th centuries.
      </Heading>
      <Paragraph>
        {`To get started, brainstorm a few similarities between Spain and Portugal's interactions with overseas territories during this period.`}
      </Paragraph>
      <RichEditor
        dataKey="similarities"
        placeholder={"1. Both Spain and Portugal…"}
      />
      <Paragraph>
        {`Now brainstorm a few differences between Spain and Portgual's interactions with overseas territories during this period.`}
      </Paragraph>
      <RichEditor
        dataKey="differences"
        placeholder={"1. Spain pursued… while Portugal…"}
      />
    </TwoUpPrompt>
  );

  if (reviewees && reviewees.responses && reviewees.responses[0]) {
    const revieweeResponse = reviewees.responses[0];

    modules[1] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>Your comparisons, for reference.</Heading>
            <Paragraph>{`Your similarities:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph>{`Your differences:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
          </div>
        }
      >
        <Heading hideInReport>
          {`Now we'll look at the similaries and differences one of your classmates noticed between Spain and Portugal's interactions with overseas territories during the 15th and 16th centuries.`}
        </Heading>
        <Paragraph>{`Their similarities:`}</Paragraph>
        <ResponseQuote
          data={revieweeResponse.similarities}
          showsRejectionButton={false}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Paragraph>{`Their differences:`}</Paragraph>
        <ResponseQuote
          data={revieweeResponse.differences}
          showsRejectionButton={revieweeResponse._rejectable}
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          What common themes do you notice between your ideas and your
          classmate's? (If you don't see any, what might one be?) Are there
          significant differences between your ideas? Explain in 2–5 sentences.
        </Heading>
        <RichEditor
          dataKey="compareWithPeer"
          placeholder={"Both my classmate and I highlighted…"}
        />
      </TwoUpPrompt>
    );

    modules[2] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>
              Your and your classmate's comparisons, for reference.
            </Heading>
            <Paragraph>{`Your similarities:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph>{`Your differences:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph>{`Their similarities:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph>{`Their differences:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.differences}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
          </div>
        }
      >
        <Heading>
          Which of the similarities you and your classmate described are most
          significant in understanding the expansion of European empires in this
          period?
        </Heading>
        <RichEditor
          dataKey="mostSignificantSimilarities"
          placeholder=""
          minHeight="2em"
        />

        <Heading>
          Which of the differences you and your classmate described are most
          significant in understanding the expansion of European empires in this
          period?
        </Heading>
        <RichEditor
          dataKey="mostSignificantDifferences"
          placeholder=""
          minHeight="2em"
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
            <Paragraph>{`Your similarities:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph>{`Your differences:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph>{`Their similarities:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph>{`Their differences:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.differences}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
          </div>
        }
      >
        <Paragraph hideInReport>
          Now we'll practice writing a full paragraph based on the ideas you've
          been exploring.
        </Paragraph>
        <Heading hideInReport>
          Focusing on the comparisons you identified as most significant,
          compare and contrast Spain and Portugal's interactions with overseas
          territories during the 15th and 16th century. Use 3–5 sentences.
        </Heading>
        <RichEditor dataKey="summary" />
      </TwoUpPrompt>
    );

    modules[4] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>
              Your and your classmate's comparisons, for reference.
            </Heading>
            <Paragraph>{`Your similarities:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).similarities}
              quotedWork
            />
            <Paragraph>{`Your differences:`}</Paragraph>
            <RichEditor
              hideInReport
              data={getUserInput(0).differences}
              quotedWork
            />
            <Paragraph>{`Their similarities:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.similarities}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
            <Paragraph>{`Their differences:`}</Paragraph>
            <ResponseQuote
              data={revieweeResponse.differences}
              showsRejectionButton={false}
              dispatcher={dispatcher}
              revieweeIndex={0}
            />
          </div>
        }
      >
        <Heading>
          Here's how your classmate answered the prompt you just answered.
        </Heading>
        <RichEditor data={revieweeResponse.summary} quotedWork />
        <Heading>
          What feedback do you have for your classmate? Here are a few prompts
          you might reflect on:
        </Heading>
        <Paragraph>
          {`• Of the similarities and differences they've mentioned, which best support their argument? Why?
          • Which are least helpful for their argument? Could they have used that comparison more effectively? Or is there something else they should have chosen instead?
          • Is any part of their analysis particularly effective or ineffective?`}
        </Paragraph>
        <RichEditor dataKey="feedback" placeholder="I noticed that…" />
      </TwoUpPrompt>
    );
  } else {
    modules[1] = waitForMatchingModule;
    modules[2] = waitForMatchingModule;
    modules[3] = waitForMatchingModule;
    modules[4] = waitForMatchingModule;
  }

  if (feedback) {
    modules[5] = (
      <TwoUpPrompt
        referenceComponent={
          <div>
            <Heading>
              For reference, the prompt was: compare and contrast Spain and
              Portugal's interactions overseas during the 15th and 16th century.
            </Heading>
            <Paragraph>Your response was:</Paragraph>
            <RichEditor data={getUserInput(3).summary} quotedWork />
            <Paragraph>A classmate of yours left you this feedback:</Paragraph>
            <RichEditor data={feedback.submitted[4].feedback} quotedWork />
          </div>
        }
      >
        <Heading hideInReport>
          Another classmate has left you feedback (on the left side of the
          screen).
        </Heading>
        <Heading hideOutsideReport>
          Another classmate has left you feedback.
        </Heading>
        <RichEditor
          data={feedback.submitted[4].highLevelFeedback}
          quotedWork
          hideOutsideReport
        />
        <Heading>
          What's your reaction to this feedback? For instance, is it surprising?
          interesting? helpful? something you already knew?
        </Heading>
        <RichEditor
          dataKey="changeAnalysis"
          placeholder="I appreciated their suggestion that…"
          minHeight="3em"
        />
        <Heading>
          Based on your classmate's edits and what you've learned in this
          activity, revise your original response for a final submission:
        </Heading>
        <RichEditor
          dataKey="finalDraft"
          initialData={getUserInput(3).summary}
          diffBase={getUserInput(3).summary}
        />
      </TwoUpPrompt>
    );
  } else {
    modules[5] = waitForFeedbackModule;
  }

  modules[6] = (
    <BasePrompt>
      <Heading>You're all done!</Heading>
      <Paragraph>
        Take a look at how far you've come. Here's your first draft:
      </Paragraph>
      <RichEditor data={getUserInput(3).summary} quotedWork />
      <Paragraph>
        And your second draft, after seeing your classmate's edits:
      </Paragraph>
      <RichEditor
        data={getUserInput(5).finalDraft}
        diffBase={getUserInput(3).summary}
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
  reviewees: revieweeRequirement({
    flowName,
    extractResponse: data => ({
      similarities: data[0].similarities,
      differences: data[0].differences,
      summary: data.length >= 3 && data[3].summary,
    }),
    matchAtPageNumber: 1,
    revieweePageNumberRequirement: 3,
    sortReviewees: (submittedUserInputs, responseA, responseB) => {
      return 0;
    },
    findReviewees: ({ inputs, userState }, captureStudentMatching) => {
      // Just grab any student.
      return [captureStudentMatching(otherUserData => true)];
    },
  }),
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, 1, [2, 3], 4, 5],
};
