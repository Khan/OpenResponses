import { _getDatabase, loadData } from "../../db";

// TODO: dedupe from db.js... but I'd rather just not leak this detail.
const flattenUser = user => {
  if (user) {
    const inputs = user.inputs;
    if (inputs && (inputs.submitted || inputs.pending)) {
      const newInputs = [];
      const extractInputs = structure => {
        if (Array.isArray(structure)) {
          structure.forEach((value, index) => (newInputs[index] = value));
        } else {
          for (const [key, value] of Object.entries(structure)) {
            newInputs[key] = value;
          }
        }
      };
      extractInputs(inputs.submitted || []);
      extractInputs(inputs.pending || []);
      return {
        ...user,
        inputs: newInputs,
      };
    } else {
      return user;
    }
  } else {
    return user;
  }
};

// When we actually return the reviewees to clients, we keep them sorted consistently, and flatten the actual reviewed submission (which is stored under the "submission" key) into the top level of the returned object.
const responsesFromRevieweeStructures = reviewees => {
  return {
    responses: Object.keys(reviewees)
      .sort()
      .map(key => ({
        ...reviewees[key].submission,
        _rejectable: reviewees[key].rejectable,
        _profile: reviewees[key].profile,
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

  // Don't assign them another student's response until they've reached the page where that's necessary.
  if (userState.furthestPageLoaded < matchAtPageNumber || inManagerInterface) {
    return undefined;
  }

  console.log("Finding a student whose answer hasn't been shown yet.");
  const otherResponseSnapshot = await _getDatabase()
    .ref(`${flowName}/${cohort}`)
    .once("value");
  const otherStudentResponses = otherResponseSnapshot.val();

  for (let userID of Object.keys(otherStudentResponses)) {
    otherStudentResponses[userID] = flattenUser(otherStudentResponses[userID]);
  }

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

    if (!otherResponse.inputs) {
      console.log(
        `Filtering out ${otherUserID} because they don't have data submitted`,
      );
      return false;
    }

    const submittedData = otherResponse.inputs;
    if (
      otherResponse.userState.furthestPageLoaded === undefined ||
      otherResponse.userState.furthestPageLoaded <=
        revieweePageNumberRequirement
    ) {
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

    return true;
  });

  const indexOfUserID = userID =>
    Object.keys(otherStudentResponses).findIndex(
      otherUserID => otherUserID === userID,
    );

  const thisUserIDIndex = indexOfUserID(userID);

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
          const aIndex = indexOfUserID(a);
          const bIndex = indexOfUserID(b);
          console.log(thisUserIDIndex, aIndex, bIndex);
          if (aIndex - thisUserIDIndex > 0) {
            if (bIndex - thisUserIDIndex > 0) {
              return aIndex - bIndex;
            } else {
              return -1;
            }
          } else {
            if (bIndex - thisUserIDIndex > 0) {
              return 1;
            } else {
              return aIndex - bIndex;
            }
          }
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
      const otherStudentData = {
        ...otherStudentResponses[userID],
        userID: userID,
      };
      return predicate(otherStudentData);
    });
    if (capturedStudentID) {
      const otherStudentData = otherStudentResponses[capturedStudentID];
      const capturedStudentData = extractResponse(otherStudentData.inputs);
      console.log("Captured student ", capturedStudentID, capturedStudentData);
      return {
        userID: capturedStudentID,
        profile: otherStudentData.userState.profile,
        submission: capturedStudentData,
        rejectable: !otherStudentData.userState.isFallbackUser,
      };
    }
  });

  console.log("new reviewees", newReviewees);

  const outputReviewees = unrejectedReviewees.concat(
    newReviewees.filter(
      r => !unrejectedReviewees.find(ur => ur.userID === r.userID),
    ),
  );
  console.log("output reviewees", outputReviewees);
  // Replace reviewees with new reviewees, unless a

  return {
    remoteData: responsesFromRevieweeStructures(outputReviewees),
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
