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
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "zoid_typing";

const extractFeedbackFromInbox = inbox => {
  const sortedKeys = Object.keys(inbox).sort();
  return sortedKeys.reduce((accumulator, key) => {
    const message = inbox[key];
    return [...accumulator, message];
  }, []);
};

const modules = (getUserInput, getRemoteData, dispatcher) => [
  //////////////////////////////////////////////////////////////////////
  // start of flow                                                    //
  //////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////// 0
  <BasePrompt>
    <Heading>
      You will see three different solutions to this problem: find the area of
      the trapezoid.
    </Heading>
    <Image path="zoid/zoid_numbers.png" />
  </BasePrompt>,

  ////////////////////////////////////////////////////////////////////// 1
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_triangles.gif" />
    }
  >
    <Paragraph>
      {`Alma: "I cut the trapezoid into two triangles."`}
    </Paragraph>
    <Heading>Do you see how she did it?</Heading>
    <MultipleChoice
      dataKey="seeHowAlmaDidIt"
      choices={["I think I understand her method.", "I'm not sure yet."]}
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 2
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_pgram.gif" />
    }
  >
    <Paragraph>
      {`Beth: "I rotated the top part around to make one long parallelogram."`}
    </Paragraph>
    <Heading>Do you see how Beth did it?</Heading>
    <MultipleChoice
      dataKey="seeHowBethDidIt"
      choices={["I think I understand her method.", "I'm not sure yet."]}
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 3
  <TwoUpPrompt
    referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
    passThroughInManagerUI
  >
    <Heading>
      Now you will have a chance to work with other students to make sense of
      the methods.
    </Heading>
    <Paragraph>
      {`Alma: "I cut the trapezoid into two triangles."
        Beth: "I rotated the top part around to make one long parallelogram."`}
    </Paragraph>
    <Heading>
      Brainstorm: How does the formula, Area = 1/2 * h * (b_1 + b_2), connect or
      relate to Alma's and Beth's methods?
    </Heading>
    <RichEditor
      dataKey="solnObservations"
      placeholder="One connection I notice is..."
    />
    <Heading>
      What questions do you have about these methods? Or, what questions might
      another student have?
    </Heading>
    <RichEditor dataKey="solnQuestions" placeholder="I still wonder why..." />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 4
  getRemoteData("reviewees") && getRemoteData("reviewees").responses
    ? <TwoUpPrompt
        referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
        passThroughInManagerUI
      >
        <Paragraph>
          Another student wrote this about the three methods:
        </Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[0].solnObservations}
          showsRejectionButton={
            getRemoteData("reviewees").responses[0]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Paragraph>But they had these questions:</Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[0].solnQuestions}
          showsRejectionButton={
            getRemoteData("reviewees").responses[0]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={0}
        />
        <Heading>
          Think about what they wrote. Help build on their ideas, and help
          answer their questions. Write at least two sentences.
        </Heading>
        <RichEditor dataKey="feedback" />
      </TwoUpPrompt>
    : <TwoUpPrompt
        referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
        blockNextButton
        passThroughInManagerUI
      >
        <Heading>Matching you with a partner. One moment...</Heading>
      </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 5
  getRemoteData("reviewees") && getRemoteData("reviewees").responses
    ? <TwoUpPrompt
        referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
        passThroughInManagerUI
      >
        <Paragraph>
          Another student wrote this about the three methods:
        </Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[1].solnObservations}
          showsRejectionButton={
            getRemoteData("reviewees").responses[1]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={1}
        />
        <Paragraph>But they had these questions:</Paragraph>
        <ResponseQuote
          data={getRemoteData("reviewees").responses[1].solnQuestions}
          showsRejectionButton={
            getRemoteData("reviewees").responses[1]._rejectable
          }
          dispatcher={dispatcher}
          revieweeIndex={1}
        />
        <Heading>
          Think about what they wrote. Help build on their ideas, and help
          answer their questions. Write at least two sentences.
        </Heading>
        <RichEditor dataKey="feedback" />
      </TwoUpPrompt>
    : <TwoUpPrompt
        referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
        blockNextButton
        passThroughInManagerUI
      >
        <Heading>Matching you with a partner. One moment...</Heading>
      </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 6
  getRemoteData("_inbox") &&
  extractFeedbackFromInbox(getRemoteData("_inbox")).length > 0
    ? <TwoUpPrompt
        referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
        passThroughInManagerUI
      >
        <Paragraph hideInReport>This was your original analysis:</Paragraph>
        <RichEditor
          data={getUserInput(3).solnObservations} // index here matches 0-indexed index of card (see comments)
          quotedWork
          hideInReport
        />
        <Paragraph hideInReport>And you had this question:</Paragraph>
        <RichEditor
          data={getUserInput(3).solnQuestions}
          quotedWork
          hideInReport
        />
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

  ////////////////////////////////////////////////////////////////////// 7
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_avg.gif" />
    }
  >
    <Heading>
      Now that you have talked about Alma's and Beth's ideas, consider one more
      solution:
    </Heading>
    <Paragraph>
      {`Coco: "I rotated little triangles around to make the trapezoid into a rectangle, and the rectangle width is the average of the top and bottom."`}
    </Paragraph>
    <Heading>How would you evaluate Coco's work and explanation?</Heading>
    <SelectAllThatApply
      choices={[
        "Interprets the given information appropriately.",
        "Chooses a good strategy.",
        "Makes connections between the diagram and calculations.",
        "Uses precise language and vocabulary.",
        "Gives a complete explanation such that another student could understand.",
      ]}
      dataKey="checklistCoco"
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 8
  <TwoUpPrompt
    referenceComponent={<Image path="zoid/zoid_solnsABC.png" />}
    passThroughInManagerUI
  >
    <Paragraph>
      The three students looked at each others methods and began to discuss the
      mathematics. Think about what they say:
    </Paragraph>
    <Paragraph>
      {`Alma: "I noticed we all used a 1/2 in different ways."
        Beth: "I noticed a connection between my parallelogram width and Coco's rectangle width."
        Coco: "I noticed our algebra is similar to the trapezoid area formula.`}
    </Paragraph>
    <Heading>Making Connections:</Heading>
    <Heading>
      How does Coco's solution connect to the formula, Area = 1/2 * h * (b_1 +
      b_2) ? How can the three methods help explain the trapezoid area formula?
    </Heading>
    <Paragraph>Write at least four sentences.</Paragraph>
    <RichEditor dataKey="explainAll" />
  </TwoUpPrompt>,

  // potential for self-reflection / evaluation for us:
  // Do you understand Alma's, Beth's, Coco's solutions better?

  ////////////////////////////////////////////////////////////////////// 9
  <BasePrompt>
    <Heading>You're all done!</Heading>
    <Paragraph>
      This activity was an experiment in helping learners think and write about
      different but connected ideas. We're still improving these experiments!
      Please help us by answering a few questions below:
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
    {getRemoteData("otherResponses") &&
    getRemoteData("otherResponses").responses &&
    getRemoteData("otherResponses").responses.length > 0
      ? <div>
          <Heading>
            Here is your explanation of the formula along with the work from
            your classmates.
          </Heading>
          <Paragraph>
            You can return to this page to see more work as it gets turned in.
          </Paragraph>
          <div>
            {[
              getUserInput(6).explainAll,
              ...((getRemoteData("otherResponses") || {}).responses || []),
            ].map((response, i) =>
              <RichEditor data={response} key={i} quotedWork />,
            )}
          </div>
        </div>
      : null}
  </BasePrompt>,
];
//////////////////////////////////////////////////////////////////////
// end of flow                                                      //
//////////////////////////////////////////////////////////////////////

const maximumTimesResponseShown = 1000000;
const numberOfReviewees = 2;

const revieweeFetcher = async (
  [furthestPageLoaded, pendingRejections, forceAssignReviewee],
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
    const moduleData = studentData.inputs.submitted
      ? studentData.inputs.submitted[3] // card number
      : studentData.inputs[3]; // card number
    const { solnQuestions, solnObservations } = moduleData;
    return { solnQuestions, solnObservations };
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
    reviewees.shift();
  }

  if (reviewees.length === numberOfReviewees) {
    return responsesFromRevieweeStructures(reviewees);
  }

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < 4 || inManagerInterface) {
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

      if (
        !otherResponse.inputs ||
        !otherResponse.inputs.submitted ||
        !otherResponse.inputs.submitted[3]
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
        if ((aUserState.reviewerCount || 0) < (bUserState.reviewerCount || 0)) {
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
    });
    console.log("All valid user IDs", allValidUserIDs);

    while (reviewees.length < numberOfReviewees && allValidUserIDs.length > 0) {
      const prospectiveStudentID =
        forceAssignReviewee || allValidUserIDs.shift();
      forceAssignReviewee = null;
      const capturedStudentID = prospectiveStudentID;
      const otherStudentData = otherStudentResponses[prospectiveStudentID];
      const capturedStudentData = responseFromStudentData(otherStudentData);
      console.log("Captured student ", capturedStudentID, capturedStudentData);
      reviewees.push({
        userID: capturedStudentID,
        submission: capturedStudentData,
        rejectable: !otherStudentData.userState.isFallbackUser,
      });
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
    inputs: [
      "userState.furthestPageLoaded",
      "userState.pendingRejections",
      "userState.forceAssignReviewee",
    ],
    // Given the student's interpretation, find an alternative student response:
    fetcher: revieweeFetcher,
  },

  otherResponses: {
    inputs: ["userState.furthestPageLoaded"],
    fetcher: async ([furthestPageLoaded], userID, cohort, { userState }) => {
      if (furthestPageLoaded < 7) {
        return undefined;
      }
      const users = await loadData(flowName, cohort);
      const responses = Object.keys(users)
        .filter(otherUserID => otherUserID !== userID)
        .map(k => users[k])
        .filter(
          userData =>
            userData.userState &&
            userData.userState.furthestPageLoaded >= 7 &&
            !userData.userState.isFallbackUser,
        )
        .map(userData => userData.inputs[6].explainAll);
      return { responses };
    },
  },
};

export default {
  modules,
  remoteDataRequirements,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [3, 4, 5, 6, 8],
  submissionThreshold: 3,
  needsReviewModuleID: 6,
};
