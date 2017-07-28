import { css, StyleSheet } from "aphrodite";
import moment from "moment";
import React from "react";

import { signIn } from "../lib/auth";
import { _getDatabase } from "../lib/db";
import flowLookupTable from "../lib/flows";
import sharedStyles from "../lib/styles";

export default class QueuePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
    };
  }

  componentDidMount = () => {
    (async () => {
      const flowID = this.props.url.query.flowID;
      await signIn();
      const flowData = await _getDatabase().ref(flowID).once("value");
      this.setState({ flowData: flowData.val(), ready: true });
    })();
  };

  render = () => {
    const flowID = this.props.url.query.flowID;
    if (!flowID) {
      return <h1>You need to add ?flowID= to your URL.</h1>;
    }

    if (!this.state.ready) {
      return null;
    }

    const flow = flowLookupTable[flowID];
    const submissionThreshold = flow.submissionThreshold || 0;

    return (
      <div className={css(styles.container)}>
        <p>
          The following users have submitted work but haven't received any
          feedback:
        </p>
        {Object.keys(this.state.flowData || {}).map(cohortID => {
          const cohortData = this.state.flowData[cohortID];
          const userIDsAwaitingFeedback = Object.keys(
            cohortData,
          ).filter(userID => {
            const userData = cohortData[userID];
            return (
              userData.inputs &&
              userData.inputs.submitted &&
              userData.inputs.submitted[submissionThreshold] &&
              !userData.userState.isFallbackUser &&
              Object.keys(userData.inputs.submitted).length > 1 &&
              !userData.inbox
            );
          });
          if (userIDsAwaitingFeedback.length === 0) {
            return null;
          }
          const fallbackUserID = Object.keys(cohortData).find(
            userID =>
              cohortData[userID].userState &&
              cohortData[userID].userState.isFallbackUser,
          );
          return (
            <div>
              <h2>
                {cohortID}
              </h2>
              <div>
                {userIDsAwaitingFeedback.map(u =>
                  <p>
                    <a
                      href={`/?flowID=${flowID}&classCode=${cohortID}&userID=${fallbackUserID}&forceAssignReviewee=${u}`}
                    >
                      {cohortData[u].userState.email}
                    </a>: last submitted{" "}
                    {moment(
                      cohortData[u].log[
                        Object.keys(cohortData[u].log)
                          .reverse()
                          .find(
                            logKey =>
                              cohortData[u].log[logKey].type === "submission",
                          )
                      ].time,
                    ).fromNow()}; {cohortData[u].userState.reviewerCount ||
                      0}{" "}
                    assigned reviewers ({Object.keys(cohortData)
                      .filter(userID => {
                        const otherUserData = cohortData[userID];
                        if (
                          !otherUserData.userState ||
                          !otherUserData.userState.reviewees
                        ) {
                          return false;
                        }
                        const reviewees = otherUserData.userState.reviewees;
                        console.log(u, reviewees);
                        return Object.keys(reviewees).some(
                          revieweeKey => reviewees[revieweeKey].userID === u,
                        );
                      })
                      .map(reviewerUserID => {
                        const reviewer = cohortData[reviewerUserID];
                        if (!reviewer) {
                          return undefined;
                        }
                        const email = reviewer.userState.email;
                        const timestampKey = Object.keys(
                          cohortData[u].log,
                        ).find(logKey => {
                          const log = cohortData[u].log[logKey];
                          return (
                            log.type === "addReviewer" &&
                            log.reviewer === reviewerUserID
                          );
                        });
                        const timestamp =
                          timestampKey && cohortData[u].log[timestampKey].time;
                        const timestampString =
                          timestamp && moment(timestamp).fromNow();
                        return `${email} ${timestampString}`;
                      })
                      .filter(email => email)
                      .join(", ")}); rejected{" "}
                    {cohortData[u].userState.rejectedCount || 0} times
                  </p>,
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
});
