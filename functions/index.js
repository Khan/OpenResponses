const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

import activities from "./activities";

const transporter = nodemailer.createTransport(functions.config().smtp.url);

exports.findPartners = functions.database
  .ref("/{flowID}/{cohortID}/threads/{userID}")
  .onCreate(event => {
    const { flowID, cohortID } = event.params;
    const postingUserID = event.params.userID;
    const usersRef = event.data.ref.parent.parent.child("users");
    const postingUserRef = usersRef.child(postingUserID);
    // We'll begin by setting a denormalized flag for "this user has posted at least
    // one thread"
    return postingUserRef
      .child("hasPostedThread")
      .set(true)
      .then(() =>
        usersRef.once("value").then(usersSnapshot => {
          const promises = [];

          // Claim as many partners as we can for ourselves.

          const activity = activities[flowID];
          const targetPartnerCount = activity.revieweeCount;
          const allUsers = usersSnapshot.val();

          const indexOfUserID = userID =>
            Object.keys(allUsers).findIndex(
              otherUserID => otherUserID === userID,
            );

          const thisUserIDIndex = indexOfUserID(postingUserID);

          const validPartners = Object.keys(allUsers)
            .filter(
              partnerID =>
                partnerID !== postingUserID &&
                allUsers[partnerID].hasPostedThread,
            )
            .sort((a, b) => {
              const aUserData = allUsers[a];
              const bUserData = allUsers[b];

              // Fallback users always come last among peers who made a particular choice.
              if (!aUserData.isFallbackUser && bUserData.isFallbackUser) {
                return -1;
              } else if (
                aUserData.isFallbackUser &&
                !bUserData.isFallbackUser
              ) {
                return 1;
              } else {
                // Has one of these users been reviewed less than another?
                if (
                  (aUserData.reviewerCount || 0) <
                  (bUserData.reviewerCount || 0)
                ) {
                  return -1;
                } else if (
                  (aUserData.reviewerCount || 0) >
                  (bUserData.reviewerCount || 0)
                ) {
                  return 1;
                } else {
                  const aIndex = indexOfUserID(a);
                  const bIndex = indexOfUserID(b);
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
            });

          console.log("valid partners for ", postingUserID, validPartners);
          const postingUserPartnersRef = postingUserRef.child("partners");
          for (let partnerUserID of validPartners.slice(
            0,
            targetPartnerCount,
          )) {
            promises.push(
              postingUserPartnersRef.push({ userID: partnerUserID }),
            );
            promises.push(
              postingUserRef.parent
                .child(partnerUserID)
                .child("reviewerCount")
                .transaction(oldReviewerCount => oldReviewerCount + 1),
            );
          }

          // Then distribute ourselves to any students who don't yet have enough partners.

          const usersWithTooFewPartners = Object.keys(allUsers).filter(
            userID =>
              Object.keys(allUsers[userID].partners || {}).length <
                activity.revieweeCount &&
              userID !== postingUserID &&
              allUsers[userID].hasPostedThread,
          );
          console.log(
            postingUserID,
            "adding to partners list of ",
            usersWithTooFewPartners,
          );
          for (let partnerUserID of usersWithTooFewPartners) {
            promises.push(
              postingUserRef.parent
                .child(partnerUserID)
                .child("partners")
                .push({ userID: postingUserID }),
            );
          }
          if (usersWithTooFewPartners.length > 0) {
            promises.push(
              postingUserRef
                .child("reviewerCount")
                .transaction(
                  oldReviewerCount =>
                    oldReviewerCount + usersWithTooFewPartners.length,
                ),
            );
          }

          return promises;
        }),
      );
  });

exports.notifyOnPost = functions.database
  .ref("/{flowID}/{classCode}/threads/{threadKey}/posts/{postKey}")
  .onCreate(event => {
    const posterUserID = event.data.val().userID;
    // TODO: If we ever flex from threadKey == authorUserID, we'll have to change
    // this heuristic.
    if (posterUserID === event.params.threadKey) {
      return;
    }

    // Fetch the poster's email.
    const threadAuthorUserID = event.params.threadKey;
    const threadAuthorUserRef = event.data.ref.root
      .child(event.params.flowID)
      .child(event.params.classCode)
      .child("users")
      .child(threadAuthorUserID);
    return threadAuthorUserRef.once("value").then(threadAuthorSnapshot => {
      const threadAuthorUserData = threadAuthorSnapshot.val();
      const { email, realName } = threadAuthorUserData.profile;
      const { lastNotificationEmailTime } = threadAuthorUserData;

      // Only send the email if we didn't send one recently.
      if (
        lastNotificationEmailTime &&
        Date.now() - lastNotificationEmailTime < 60 * 60 * 12
      ) {
        console.log(
          `Not emailing ${threadAuthorUserID} because we emailed them ${Date.now() -
            lastNotificationEmailTime} seconds ago.`,
        );
        return;
      }

      console.log(
        `Emailing ${threadAuthorUserID} at ${email} in response to feedback from ${posterUserID}`,
      );

      const humanReadableActivityName = activities[event.params.flowID].title;
      const returnURL = `${functions.config().host.origin}/?flowID=${event
        .params.flowID}&classCode=${event.params
        .classCode}&userID=${threadAuthorUserID}&expandThread=${threadAuthorUserID}`;
      return transporter
        .sendMail({
          from: "Khan Academy <noreply@khanacademy.org>",
          to: email,
          subject: `You have new feedback available${humanReadableActivityName
            ? ` on “${humanReadableActivityName}”`
            : ""}!`,
          text: `Hello, ${realName}! Another student has replied to what you wrote for "${humanReadableActivityName}".\n\nRead it and continue the activity here: ${returnURL}`,
          html: `<p>Hello, ${realName}!</p><p>Another student has replied to what you wrote for &ldquo;${humanReadableActivityName}.&rdquo;</p><p><a href="${returnURL}">Click here</a> to read it!</p>`,
        })
        .then(() =>
          threadAuthorUserRef
            .child("lastNotificationEmailTime")
            .set(admin.database.ServerValue.TIMESTAMP),
        );
    });
  });

exports.logRejection = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/userState/pendingRejections")
  .onWrite(event => {
    if (!event.data.exists()) {
      return;
    }

    const promises = [];

    const previousRejectedIDs = new Set(event.data.previous.val() || []);
    const currentRejectedIDs = new Set(event.data.val() || []);
    currentRejectedIDs.delete(previousRejectedIDs);
    for (let rejectedID of currentRejectedIDs) {
      console.log("New rejected user", rejectedID);
      const rejectedUserID = event.data.ref.root.child(
        `${event.params.flowID}/${event.params.cohortID}/${rejectedID}`,
      );
      promises.push(
        rejectedUserID
          .child("log")
          .push({
            type: "rejected",
            time: admin.database.ServerValue.TIMESTAMP,
            rejector: event.params.userID,
          }),
      );
      promises.push(
        rejectedUserID
          .child("userState/rejectedCount")
          .transaction(count => (count || 0) + 1),
      );
    }

    const user = event.data.ref.parent.parent;
    const log = user.child("log");
    promises.push(
      log.push({
        type: "rejection",
        time: admin.database.ServerValue.TIMESTAMP,
        userIDs: event.data.val(),
      }),
    );

    return Promise.all(promises);
  });

exports.logReviewers = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/userState/reviewees")
  .onWrite(event => {
    if (!event.data.exists()) {
      return;
    }

    const promises = [];

    const previousRevieweeIDs = new Set(
      (event.data.previous.val() || []).map(r => r.userID),
    );
    const currentRevieweeIDs = new Set(
      (event.data.val() || []).map(r => r.userID),
    );
    currentRevieweeIDs.delete(previousRevieweeIDs);
    for (let revieweeID of currentRevieweeIDs) {
      console.log("New reviewee", revieweeID);
      const revieweeRef = event.data.ref.root.child(
        `${event.params.flowID}/${event.params.cohortID}/${revieweeID}`,
      );
      promises.push(
        revieweeRef
          .child("log")
          .push({
            type: "addReviewer",
            time: admin.database.ServerValue.TIMESTAMP,
            reviewer: event.params.userID,
          }),
      );
      promises.push(
        revieweeRef
          .child("userState/reviewerCount")
          .transaction(value => (value || 0) + 1),
      );
    }

    const user = event.data.ref.parent.parent;
    const log = user.child("log");
    promises.push(
      log.push({
        type: "revieweeChange",
        time: admin.database.ServerValue.TIMESTAMP,
        reviewees: event.data.val(),
      }),
    );

    return Promise.all(promises);
  });

exports.logSubmission = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/inputs/submitted/{moduleID}")
  .onWrite(event => {
    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
      console.log("Exiting because data previously existed");
      return;
    }

    // Exit when the data is deleted.
    if (!event.data.exists()) {
      console.log("Exiting because new data does not exist");
      return;
    }

    const user = event.data.ref.parent.parent.parent;
    const log = user.child("log");
    return log.push({
      type: "submission",
      moduleID: event.params.moduleID,
      time: admin.database.ServerValue.TIMESTAMP,
    });
  });

exports.logUserCreation = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/userState/email")
  .onWrite(event => {
    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
      console.log("Exiting because data previously existed");
      return;
    }

    // Exit when the data is deleted.
    if (!event.data.exists()) {
      console.log("Exiting because new data does not exist");
      return;
    }

    const user = event.data.ref.parent.parent;
    const log = user.child("log");
    return log
      .push({ type: "creation", time: admin.database.ServerValue.TIMESTAMP })
      .then(() => {
        const humanReadableFlowName = activities[event.params.flowID].title;

        if (!humanReadableFlowName || /stress/.test(event.params.cohortID)) {
          return;
        }

        return event.data.ref.parent
          .child("prepopulatedEmail")
          .once("value")
          .then(prepopulatedEmailSnapshot => {
            const prepopulatedEmail = prepopulatedEmailSnapshot.val();
            if (prepopulatedEmail) {
              return;
            }
            // TODO(andy): Include a human-readable name of the flow.
            // TODO(andy): Shorten the flow URL?
            const returnURL = `${functions.config().host.origin}/?flowID=${event
              .params.flowID}&classCode=${event.params.cohortID}&userID=${event
              .params.userID}`;
            return transporter.sendMail({
              from: "Khan Academy <noreply@khanacademy.org>",
              to: event.data.val(),
              subject: `Welcome to “${humanReadableFlowName}”!`,
              text: `Just in case you need to switch to a different computer, click this URL to pick up where you left off: ${returnURL}`,
              html: `<p>Just in case you need to switch to a different computer, <a href="${returnURL}">click this link</a> to pick up where you left off.</p>`,
            });
          });
      });
  });

exports.transferFeedback = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/inputs/submitted/{moduleID}/feedback")
  .onWrite(event => {
    // Exit when the data is deleted.
    if (!event.data.exists()) {
      console.log("Exiting because new data does not exist");
      return;
    }

    const moduleData = event.data.ref.parent;
    const submittedData = moduleData.parent;
    const inputs = submittedData.parent;
    const userData = inputs.parent;
    return userData
      .child("userState")
      .once("value")
      .then(otherStudentUserStateSnapshot => {
        const otherStudentUserState = otherStudentUserStateSnapshot.val();

        // Only transfer new submissions (unless this is a fallback user).
        if (
          !otherStudentUserState.isFallbackUser &&
          event.data.previous.exists()
        ) {
          console.log("Exiting because data previously existed");
          return;
        }

        if (!otherStudentUserState.reviewees) {
          throw new Error(`No reviewee student IDs for ${event.params.userID}`);
        }

        // Find the first non-submitted reviewee.
        const revieweeStructures = otherStudentUserState.reviewees;
        const revieweeKey = Object.keys(revieweeStructures)
          .sort()
          .find(r => !revieweeStructures[r].isSubmitted);
        if (!revieweeKey) {
          throw new Error(`No unsubmitted reviewee for ${event.params.userID}`);
        }
        const otherStudentUserID = revieweeStructures[revieweeKey].userID;

        // Mark the review as submitted.
        userData
          .child("userState/reviewees")
          .child(revieweeKey)
          .update({ isSubmitted: true })
          .then(() => {
            // Get the user's submitted data.
            return submittedData.once("value").then(submittedValuesSnapshot => {
              const submittedValues = submittedValuesSnapshot.val();
              const otherStudentRef = event.data.ref.root.child(
                `${event.params.flowID}/${event.params
                  .cohortID}/${otherStudentUserID}`,
              );
              // Save the feedback to the receiver's inbox.
              return otherStudentRef
                .child("inbox")
                .push({
                  feedback: event.data.val(),
                  profile: otherStudentUserState.profile,
                  submitted: submittedValues,
                  time: admin.database.ServerValue.TIMESTAMP,
                  fromUserID: event.params.userID,
                  fromModuleID: event.params.moduleID,
                })
                .then(() => {
                  // How many emails have we already sent to this student?
                  otherStudentRef
                    .child("userState/reviewsReceived")
                    .transaction(value => (value || 0) + 1)
                    .then(({ committed, snapshot }) => {
                      if (!committed) {
                        return;
                      }
                      if (snapshot.val() > 1) {
                        console.log(
                          `Skipping email because ${otherStudentUserID} has already received feedback.`,
                        );
                        return;
                      }
                      // Email the student receiving the feedback.
                      return otherStudentRef
                        .child("userState/email")
                        .once("value")
                        .then(
                          emailAddressSnapshot => {
                            const userEmailAddress = emailAddressSnapshot.val();
                            console.log(
                              `Emailing ${otherStudentUserID} at ${userEmailAddress} in response to feedback from ${event
                                .params.userID}`,
                            );

                            const humanReadableFlowName =
                              activities[event.params.flowID].title;
                            // TODO(andy): Shorten the flow URL?
                            const returnURL = `${functions.config().host
                              .origin}/?flowID=${event.params
                              .flowID}&classCode=${event.params
                              .cohortID}&userID=${otherStudentUserID}`;
                            return transporter.sendMail({
                              from: "Khan Academy <noreply@khanacademy.org>",
                              to: userEmailAddress,
                              subject: `You have new feedback available${humanReadableFlowName
                                ? ` on “${humanReadableFlowName}”`
                                : ""}!`,
                              text: `Another student has left you feedback on your work${humanReadableFlowName
                                ? ` for "${humanReadableFlowName}"`
                                : ""}.\n\nRead it and continue the activity here${event
                                .params.flowID === "zoid_01"
                                ? " to claim your special badge."
                                : ""}: ${returnURL}`,
                              html: `<p>Another student has left you feedback on your work${humanReadableFlowName
                                ? ` for &ldquo;${humanReadableFlowName}.&rdquo;`
                                : "."}</p><p><a href="${returnURL}">Click here</a> to read it and ${event
                                .params.flowID === "zoid_01"
                                ? "complete the activity for your special badge!"
                                : "continue the activity."}</p>${event.params
                                .flowID === "zoid_01"
                                ? '<p><img src="https://cdn.kastatic.org/images/badges/earth.png" /></p>'
                                : ""}`,
                            });
                          },
                          reason => {
                            // TODO(andy): Sentry?
                            console.error(
                              `Couldn't read email address for ${otherStudentUserID}: ${reason}`,
                            );
                          },
                        );
                    });
                });
            });
          });
      });
  });
