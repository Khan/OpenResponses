import { Raw, Plain } from "slate";

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

const flowName = "humanities_resistance";

const humanitiesPassage = (
  <div>
    <Paragraph>
      It is extremely dangerous to organize a movement around self-defense. The
      line between defensive violence and aggressive or retaliatory violence is
      a fine line indeed. When violence is tolerated even as a means of
      self-defense there is a grave danger that in the fervor of emotion the
      main fight will be lost over the question of self-defense. In violent
      warfare, one must be prepared to face ruthlessly the fact that there will
      be casualties by the thousands. […]
    </Paragraph>
    <Paragraph>
      Anyone leading a violent conflict must be willing to make a similar
      assessment regarding the possible casualties to a minority population
      confronting a well-armed, wealthy majority with a fanatical right wing
      that is capable of exterminating the entire black population.
    </Paragraph>
    <Paragraph>
      {`**— Martin Luther King, Jr. "Nonviolence: The Only Road to Freedom". May 4, 1966.**

      `}
    </Paragraph>
    <Paragraph>
      Since self preservation is the first law of nature, we assert the Afro
      American's right to self defense. The Constitution of the United States of
      America clearly affirms the right of every American citizen to bear arms.
      And as Americans, we will not give up a single right guaranteed under the
      Constitution.
    </Paragraph>
    <Paragraph>
      The history of unpunished violence against our people clearly indicates
      that we must be prepared to defend ourselves or we will continue to be a
      defenseless people at the mercy of a ruthless and violent racist mob. […]
    </Paragraph>
    <Paragraph>
      Tactics based solely on morality can only succeed when you are dealing
      with basically moral people or a moral system. A man or system which
      opposes a man because of his color is not moral.
    </Paragraph>
    <Paragraph>
      **— Malcolm X. Speech at the Founding Rally of the Organization of
      Afro-American Unity. June 28, 1964.**
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = ["Martin Luther King, Jr.", "Malcolm X"];

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const revieweePreparationModule = (
  getUserInput,
  getRemoteData,
  dispatcher,
  index,
) =>
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[index]
    ? <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          {`This student ${getRemoteData("reviewees").responses[index]
            .decision === getUserInput(0).decision
            ? "agreed"
            : "disagreed"}, supporting ${choices[
            getRemoteData("reviewees").responses[index].decision
          ]}.`}
        </Heading>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[index].decisionExplanation}
          showsRejectionButton={
            getRemoteData("reviewees").responses[index]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={index}
        />
        <Heading>
          {`Read your peer's paragraph. Explain in one sentence why your peer advocated for ${choices[
            getRemoteData("reviewees").responses[index].decision
          ]}.`}
        </Heading>
        <RichEditor dataKey="summary" placeholder="This student argued that…" />
      </TwoUpPrompt>
    : <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
        <Heading>Matching you with a partner. One moment...</Heading>
      </TwoUpPrompt>;

const revieweeSubmissionModule = (
  getUserInput,
  getRemoteData,
  dispatcher,
  index,
) =>
  getRemoteData("reviewees") &&
  getRemoteData("reviewees").responses &&
  getRemoteData("reviewees").responses[index]
    ? <TwoUpPrompt {...twoUpPromptProps}>
        <Heading>
          How could this student have made their argument more convincing? For
          instance, what could they have added or left out from the text?
        </Heading>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[index].decisionExplanation}
          showsRejectionButton={
            getRemoteData("reviewees").responses[index]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={index}
          showsRejectionButton={false}
          hideInReport
        />
        <RichEditor
          dataKey="feedback"
          placeholder="This argument would have been more convincing if…"
        />
      </TwoUpPrompt>
    : <TwoUpPrompt {...twoUpPromptProps} blockNextButton>
        <Heading>Loading...</Heading>
      </TwoUpPrompt>;

const modules = (getUserInput, getRemoteData, dispatcher) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      In these two speeches, Martin Luther King Jr. and Malcolm X offer
      contrasting ideas about the use of violence to create social change within
      the Civil Rights Movement.
    </Paragraph>
    <Heading>
      Which argument do you find more convincing? Use 3–4 sentences to make your
      case. Use at least one quote from the text.
    </Heading>
    <MultipleChoice dataKey="decision" choices={choices} />
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
  revieweePreparationModule(getUserInput, getRemoteData, dispatcher, 0),

  // 2
  revieweeSubmissionModule(getUserInput, getRemoteData, dispatcher, 0),

  // 3
  revieweePreparationModule(getUserInput, getRemoteData, dispatcher, 1),

  // 4
  revieweeSubmissionModule(getUserInput, getRemoteData, dispatcher, 1),

  // 5
  getRemoteData("_inbox") &&
  extractFeedbackFromInbox(getRemoteData("_inbox")).length > 0
    ? <TwoUpPrompt {...twoUpPromptProps}>
        <Heading hideInReport>
          {`You originally wrote this in support of ${choices[
            getUserInput(0).decision
          ]}:`}
        </Heading>
        <RichEditor
          quotedWork
          data={getUserInput(0).decisionExplanation}
          hideInReport
        />
        <Heading>
          {`Another student (who originally supported ${choices[
            extractFeedbackFromInbox(getRemoteData("_inbox"))[0].submitted[0]
              .decision
          ]}) summarized your argument:`}
        </Heading>
        <RichEditor
          quotedWork
          data={
            extractFeedbackFromInbox(getRemoteData("_inbox"))[0].submitted[
              extractFeedbackFromInbox(getRemoteData("_inbox"))[0]
                .fromModuleID - 1
            ].summary
          }
        />
        <Heading>
          That student suggested you could make your argument more convincing in
          this way:
        </Heading>
        <RichEditor
          quotedWork
          data={extractFeedbackFromInbox(getRemoteData("_inbox"))[0].feedback}
        />
        <Heading>
          Now improve upon your original response and submit a final draft.
        </Heading>
        <RichEditor
          dataKey="revision"
          initialData={getUserInput(0).decisionExplanation}
        />
      </TwoUpPrompt>
    : <BasePrompt {...twoUpPromptProps} blockNextButton>
        <Heading>You'll get feedback shortly!</Heading>
        <Paragraph>
          Another student will soon see your work and send you feedback.
        </Paragraph>
        <Paragraph>
          This page will automatically refresh to show their feedback when it's
          available. You'll also receive an email with a link back to here when
          your feedback is ready.
        </Paragraph>
      </BasePrompt>,

  // 6
  <BasePrompt>
    <Heading>You're all done!</Heading>
    <Paragraph>
      This activity was an experiment. We're trying to make them better! Please
      help us by answering a few questions below:
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
    <div
      dangerouslySetInnerHTML={{
        __html: `<div class="typeform-widget" data-url="https://khanacademy.typeform.com/to/KINOmf" data-hide-headers=true data-hide-footer=true style="width: 100%; height: 1500px;" > </div> <script> (function() { var qs,js,q,s,d=document, gi=d.getElementById, ce=d.createElement, gt=d.getElementsByTagName, id="typef_orm", b="https://embed.typeform.com/"; if(!gi.call(d,id)) { js=ce.call(d,"script"); js.id=id; js.src=b+"embed.js"; q=gt.call(d,"script")[0]; q.parentNode.insertBefore(js,q) } })() </script>`,
      }}
    />
  </BasePrompt>,
];

const maximumTimesResponseShown = 1000000;
const numberOfReviewees = 2;

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
    const firstModuleData = studentData.inputs.submitted
      ? studentData.inputs.submitted[0]
      : studentData.inputs[0];
    return {
      decision: firstModuleData.decision,
      decisionExplanation: firstModuleData.decisionExplanation,
    };
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

  if (forceAssignReviewee) {
    reviewees.pop();
  }

  if (reviewees.length === numberOfReviewees) {
    return responsesFromRevieweeStructures(reviewees);
  }

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < 1 || inManagerInterface) {
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

    while (reviewees.length < numberOfReviewees && allValidUserIDs.length > 0) {
      const prospectiveStudentID =
        forceAssignReviewee || allValidUserIDs.shift();

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
          !otherStudentData.userState.isFallbackUser &&
          !forceAssignReviewee
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
      forceAssignReviewee = null;
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

// TODO(andy): Extract flow and cohort IDs. And also the direct use of the database. This implementation is very much a hack until we figure out patterns here.
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
  reportSpec: [0, [1, 2], [3, 4], 5],
};
