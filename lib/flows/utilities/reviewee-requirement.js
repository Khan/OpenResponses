import { _getDatabase, loadData } from "../../db";

// When we actually return the reviewees to clients, we keep them sorted consistently, and flatten the actual reviewed submission (which is stored under the "submission" key) into the top level of the returned object.
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

// extract matching rule
const revieweeFetcher = ({
  matchAtPageNumber,
  extractResponse,
  revieweePageNumberRequirement,
  sortReviewees,
  findReviewees,
  flowName,
}) => async (
  [furthestPageLoaded, pendingRejections, forceAssignReviewee],
  userID,
  cohort,
  { inputs, userState },
  inManagerInterface,
) => {
  // TODO: Move this to a separate server function.
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

  // If we have reviewees and they aren't rejected, go ahead and use 'em.
  if (
    unrejectedReviewees.length > 0 &&
    unrejectedReviewees.length === reviewees.length
  ) {
    return responsesFromRevieweeStructures(reviewees);
  }

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < matchAtPageNumber || inManagerInterface) {
    return undefined;
  }
  const decision = inputs[0].decision;

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
    if (!submittedData[revieweePageNumberRequirement]) {
      console.log(
        `Filtering out ${otherUserID} because they haven't yet submitted ${revieweePageNumberRequirement}.`,
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
    const sortResult = sortReviewees(
      inputs,
      otherStudentResponses[a],
      otherStudentResponses[b],
    );
    if (sortResult === 0) {
      const aUserState = otherStudentResponses[a].userState;
      const bUserState = otherStudentResponses[b].userState;

      // Fallback users always come last among peers who made a particular choice.
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
    } else {
      return sortResult;
    }
  });
  console.log("All valid user IDs", allValidUserIDs);

  // TODO(andy): handle forceAssignReviewee
  let newReviewees = findReviewees({ inputs, userState }, predicate => {
    const capturedStudentID = allValidUserIDs.find(userID => {
      const otherStudentData = otherStudentResponses[userID];
      return predicate(otherStudentData);
    });
    if (capturedStudentID) {
      const otherStudentData = otherStudentResponses[capturedStudentID];
      const capturedStudentData = extractResponse(
        otherStudentData.inputs.submitted,
      );
      console.log("Captured student ", capturedStudentID, capturedStudentData);
      return {
        userID: capturedStudentID,
        submission: capturedStudentData,
        rejectable: !otherStudentData.userState.isFallbackUser,
      };
    }
  });

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

  return {
    remoteData: responsesFromRevieweeStructures(newReviewees),
    newUserState: {
      reviewees: newReviewees,
      pendingRejections: {},
      forceAssignReviewee: null,
    },
  };
};

export default parameters => ({
  inputs: [
    "userState.furthestPageLoaded",
    "userState.pendingRejections",
    "userState.forceAssignReviewee",
  ],
  fetcher: revieweeFetcher(parameters),
});