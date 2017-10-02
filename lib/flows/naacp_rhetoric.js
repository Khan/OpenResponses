import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RejectResponseButton from "../components/reject-response-button"; // TODO remove
import ResponseQuote from "../components/response-quote";
import RichEditor from "../components/rich-editor";
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "naacp_rhetoric";

const humanitiesPassage = (
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
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = ["Letter A", "Letter B"];

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const findStudentFeedback = (getUserInput, inbox, agreeing) => {
  const decision = getUserInput(0).decision;
  return extractFeedbackFromInbox(inbox).find(
    message => agreeing === (decision === message.submitted[0].decision),
  );
};

const modules = (getUserInput, getRemoteData, dispatcher) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph hideInReport>
      The following two letters are both from the archives of the National
      Association for the Advancement of Colored People (NAACP) and were written
      over **twenty years apart**. Read the letters and determine which was
      written first. Then explain your answers using evidence from the letters
      and your knowledge of history.
    </Paragraph>
    <MultipleChoice
      dataKey="decision"
      choices={choices.map(c => `${c} was likely written first.`)}
    />
    <RichEditor
      dataKey="decisionExplanation"
      placeholder={
        getUserInput(0).decision !== undefined
          ? `${choices[
              getUserInput(0).decision
            ]} was likely written first because...`
          : undefined
      }
    />
  </TwoUpPrompt>,

  // 1
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[0] ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading>
        {`This peer of yours disagreed, arguing that ${choices[
          getRemoteData("reviewees").responses[0].decision
        ]} came first.`}
      </Heading>
      <ResponseQuote
        data={getRemoteData("reviewees").responses[0].decisionExplanation}
        showsRejectionButton={
          getRemoteData("reviewees").responses[0]._rejectable
        }
        dispatcher={dispatcher}
        revieweeIndex={0}
      />
      <Heading>
        {`Read your peer's paragraph. Explain in 2–5 sentences why your peer believes ${choices[
          getRemoteData("reviewees").responses[0].decision
        ]} came first.`}
      </Heading>
      <RichEditor dataKey="summary" placeholder="This student argued that…" />
    </TwoUpPrompt>
  ) : (
    <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
      <Heading>Matching you with a partner. One moment...</Heading>
    </TwoUpPrompt>
  ),

  // 2
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[0] ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading hideInReport>
        {`This peer of yours disagreed, arguing that ${choices[
          getRemoteData("reviewees").responses[0].decision
        ]} came first.`}
      </Heading>
      <ResponseQuote
        hideInReport
        data={getRemoteData("reviewees").responses[0].decisionExplanation}
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
  ) : (
    <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
      <Heading>Matching you with a partner. One moment...</Heading>
    </TwoUpPrompt>
  ),

  // 3
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[1] ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading>
        {`This second peer of yours agreed that ${choices[
          getRemoteData("reviewees").responses[1].decision
        ]} came first.`}
      </Heading>
      <ResponseQuote
        data={getRemoteData("reviewees").responses[1].decisionExplanation}
        showsRejectionButton={
          getRemoteData("reviewees").responses[1]._rejectable
        }
        dispatcher={dispatcher}
        revieweeIndex={1}
      />
      <Heading>
        {`Read your peer's paragraph. Explain in 2–5 sentences why your peer believes ${choices[
          getRemoteData("reviewees").responses[1].decision
        ]} came first.`}
      </Heading>
      <RichEditor dataKey="summary" placeholder="This student argued that…" />
    </TwoUpPrompt>
  ) : (
    <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
      <Heading>Matching you with a partner. One moment...</Heading>
    </TwoUpPrompt>
  ),

  // 4
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[1] ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading>
        Without changing any of the evidence they cited, help your peer make
        their argument more persuasive by editing or adding to their answer
        below.
      </Heading>
      <RichEditor
        dataKey="feedback"
        initialData={
          getRemoteData("reviewees").responses[1].decisionExplanation
        }
      />
    </TwoUpPrompt>
  ) : (
    <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
      <Heading>Matching you with a partner. One moment...</Heading>
    </TwoUpPrompt>
  ),

  // 5
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading hideInReport>
      {`${getUserInput(0).decision === 0
        ? "Just like you thought"
        : "Unlike as you initially thought"}, letter A was written first.`}
    </Heading>
    <Heading>
      What tips and strategies did you learn from editing your peer's work?
      Based on what you've learned in the last few pages, revise your answer to
      make it more persuasive.
    </Heading>
    <RichEditor
      dataKey="preFeedbackRevision"
      initialData={getUserInput(0).decisionExplanation}
    />
  </TwoUpPrompt>,

  // 6
  getRemoteData("_inbox") &&
  findStudentFeedback(getUserInput, getRemoteData("_inbox"), true) ? (
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
        A peer of yours who agreed with you read your answer and summarized it:
      </Heading>
      <RichEditor
        data={
          findStudentFeedback(getUserInput, getRemoteData("_inbox"), true)
            .submitted[
            findStudentFeedback(getUserInput, getRemoteData("_inbox"), true)
              .fromModuleID - 1
          ].summary
        }
        quotedWork
      />
      <Heading>Read and reflect: is this what you intended?</Heading>
      <RichEditor
        dataKey="reflection"
        placeholder="It seems like maybe my second point wasn't clear…"
      />
    </TwoUpPrompt>
  ) : (
    <BasePrompt {...twoUpPromptProps} blockNextButton>
      <Heading>You'll get feedback shortly!</Heading>
      <Paragraph>
        Great work! Take a moment to think about everything you've learned in
        this exercise. You'll also get feedback on your final piece of writing
        from another student shortly, giving you the opportunity to keep
        learning!
      </Paragraph>
      <Paragraph>
        This page will automatically refresh to show their feedback when it's
        available. You'll also receive an email with a link back to here when
        your feedback is ready.
      </Paragraph>
    </BasePrompt>
  ),

  // 7
  getRemoteData("_inbox") &&
  findStudentFeedback(getUserInput, getRemoteData("_inbox"), true) ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading hideInReport>Here's your latest revision:</Heading>
      <RichEditor
        hideInReport
        data={getUserInput(5).preFeedbackRevision}
        quotedWork
      />
      <Heading>
        That same peer edited your revised response to make it more persuasive:
      </Heading>
      <RichEditor
        data={
          findStudentFeedback(getUserInput, getRemoteData("_inbox"), true)
            .feedback
        }
        quotedWork
      />
      <Heading>What did they change?</Heading>
      <RichEditor
        dataKey="changeAnalysis"
        placeholder="I noticed that they added…"
        minHeight="3em"
      />
      <Heading>
        Why do you think they changed it? What effect did it have on your work?
      </Heading>
      <RichEditor
        dataKey="changeAnalysis2"
        placeholder="I think they were trying to improve… which strengthens my argument's…"
        minHeight="3em"
      />
    </TwoUpPrompt>
  ) : (
    <BasePrompt {...twoUpPromptProps} blockNextButton>
      <Heading>You'll get feedback shortly!</Heading>
      <Paragraph>
        Another student will soon see your work and send you feedback.
      </Paragraph>
      <Paragraph>
        This page will automatically refresh to show their feedback when it's
        available. You'll also receive an email with a link back to here when
        your feedback is ready.
      </Paragraph>
    </BasePrompt>
  ),

  // 8
  getRemoteData("_inbox") &&
  findStudentFeedback(getUserInput, getRemoteData("_inbox"), true) ? (
    <TwoUpPrompt {...twoUpPromptProps}>
      <Heading hideInReport>Here's your latest revision:</Heading>
      <RichEditor
        hideInReport
        data={getUserInput(5).preFeedbackRevision}
        quotedWork
      />
      <Heading hideInReport>Here are your peer's edits:</Heading>
      <RichEditor
        hideInReport
        data={
          findStudentFeedback(getUserInput, getRemoteData("_inbox"), true)
            .feedback
        }
        quotedWork
      />
      <Heading>
        Based on your peer's edits and what you've learned in this activity,
        revise your original response for a final submission:
      </Heading>
      <RichEditor
        dataKey="finalDraft"
        initialData={getUserInput(5).preFeedbackRevision}
      />
    </TwoUpPrompt>
  ) : (
    <BasePrompt {...twoUpPromptProps} blockNextButton>
      <Heading>You'll get feedback shortly!</Heading>
      <Paragraph>
        Another student will soon see your work and send you feedback.
      </Paragraph>
      <Paragraph>
        This page will automatically refresh to show their feedback when it's
        available. You'll also receive an email with a link back to here when
        your feedback is ready.
      </Paragraph>
    </BasePrompt>
  ),

  // 9
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      Think about what you learned in this activity. What skills might you want
      to focus on developing as you keep learning?
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
  </TwoUpPrompt>,

  // 10
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
    <RichEditor data={getUserInput(5).preFeedbackRevision} quotedWork />
    <Paragraph>And here's your final draft:</Paragraph>
    <RichEditor data={getUserInput(8).finalDraft} quotedWork />
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
  </BasePrompt>,
];

const maximumTimesResponseShown = 1000000;
const numberOfReviewees = 2;
const pageForReview = 5;

const revieweeFetcher = async (
  [furthestPageLoaded, decision, pendingRejections, forceAssignReviewee],
  userID,
  cohort,
  { userState },
  inManagerInterface,
) => {
  const responseFromStudentData = studentData => {
    // Especially hacky now that we've distinguished pending and submitted data. This whole thing needs to sit behind an abstraction layer.
    if (!studentData) {
      return undefined;
    }
    const submittedData = studentData.inputs.submitted || studentData.inputs;
    if (!submittedData[pageForReview]) {
      return undefined;
    }
    return {
      decision: submittedData[0].decision,
      decisionExplanation: submittedData[pageForReview].preFeedbackRevision,
    };
  };

  const responsesFromRevieweeStructures = reviewees => {
    return {
      responses: Object.keys(reviewees)
        .sort()
        .map(key => ({
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
    .map(rk => userState.reviewees[rk]);
  const unrejectedReviewees = reviewees.filter(
    reviewee => !isRejectedReviewee(reviewee.userID),
  );

  // TODO(andy): Given our specific disagree+agree pairing requirement here, we'll have to do something fancier to really make this work.
  // if (forceAssignReviewee) {
  // reviewees.shift();
  // }

  if (unrejectedReviewees.length === numberOfReviewees) {
    return responsesFromRevieweeStructures(reviewees);
  }

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < 1 || inManagerInterface) {
    return undefined;
  } else if (unrejectedReviewees.length < numberOfReviewees) {
    console.log("Finding a student whose answer hasn't been shown yet.");
    const otherResponseSnapshot = await _getDatabase()
      .ref(`${flowName}/${cohort}`)
      .once("value");
    const otherStudentResponses = otherResponseSnapshot.val();
    console.log("snapshot", otherStudentResponses);
    const allValidUserIDs = Object.keys(
      otherStudentResponses || {},
    ).filter(otherUserID => {
      if (otherUserID === forceAssignReviewee) {
        return true;
      }
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

      if (!otherResponse.inputs || !otherResponse.inputs.submitted) {
        console.log(
          `Filtering out ${otherUserID} because they don't have data submitted`,
        );
        return false;
      }

      const submittedData =
        otherResponse.inputs.submitted || otherResponse.inputs;
      if (!submittedData[pageForReview]) {
        console.log(
          `Filtering out ${otherUserID} because they haven't yet submitted ${pageForReview}.`,
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
      const aAgrees =
        otherStudentResponses[a].inputs.submitted[0].decision === decision;
      const bAgrees =
        otherStudentResponses[b].inputs.submitted[0].decision === decision;
      // Did these students make the same decision?
      if ((aAgrees && bAgrees) || (!aAgrees && !bAgrees)) {
        const aUserState = otherStudentResponses[a].userState;
        const bUserState = otherStudentResponses[b].userState;

        // Fallback users always come last among peers who made a particular choice.
        if (!aUserState.isFallbackUser && bUserState.isFallbackUser) {
          return -1;
        } else if (aUserState.isFallbackUser && !bUserState.isFallbackUser) {
          return 1;
        } else {
          // Has one of these users been reviewed less than another?
          if (
            (aUserState.reviewerCount || 0) < (bUserState.reviewerCount || 0)
          ) {
            return -1;
          } else if (
            (aUserState.reviewerCount || 0) > (bUserState.reviewerCount || 0)
          ) {
            return 1;
          } else {
            // TODO: randomize within groups
            return 0;
          }
        }
      } else if (aAgrees && !bAgrees) {
        return 1;
      } else if (!aAgrees && bAgrees) {
        return -1;
      }
    });
    console.log("All valid user IDs", allValidUserIDs);

    const captureStudent = capturedStudentID => {
      const otherStudentData = otherStudentResponses[capturedStudentID];
      const capturedStudentData = responseFromStudentData(otherStudentData);
      console.log("Captured student ", capturedStudentID, capturedStudentData);
      return {
        userID: capturedStudentID,
        submission: capturedStudentData,
        rejectable: !otherStudentData.userState.isFallbackUser,
      };
    };

    const findStudent = agreeing =>
      allValidUserIDs.find(userID => {
        const otherStudentData = otherStudentResponses[userID];
        return (
          agreeing ===
          (otherStudentData.inputs.submitted[0].decision === decision)
        );
      });

    // TODO(andy): handle forceAssignReviewee
    let newReviewees = [
      captureStudent(findStudent(false)),
      captureStudent(findStudent(true)),
    ];
    // Replace reviewees with new reviewees, unless an old, non-rejected reviewee was already in place.
    newReviewees = newReviewees.map((newReviewee, index) => {
      if (
        reviewees.length <= index ||
        isRejectedReviewee(reviewees[index].userID)
      ) {
        return newReviewee;
      } else {
        return reviewees[index];
      }
    });

    if (newReviewees.length === numberOfReviewees) {
      return {
        remoteData: responsesFromRevieweeStructures(newReviewees),
        newUserState: {
          reviewees: newReviewees,
          pendingRejections: {},
          forceAssignReviewee: null,
        },
      };
    } else if (allValidUserIDs.length < numberOfReviewees) {
      throw new Error(
        `You need to make more dummy data in support of decision ${decision}! You'll need ${numberOfReviewees} valid entries; you only have ${allValidUserIDs}.`,
      );
    } else {
      throw new Error(`Failed to capture a user.`);
    }
  }
};

const remoteDataRequirements = {
  reviewees: {
    // Our choice of other student response depends on this student's interpretation:
    inputs: [
      "userState.furthestPageLoaded",
      "inputs[0].decision",
      "userState.pendingRejections",
      "userState.forceAssignReviewee",
    ],
    // Given the student's interpretation, find an alternative student response:
    fetcher: revieweeFetcher,
  },
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, [1, 2], [3, 4], 5, [6, 7], [8, 9]],
};
