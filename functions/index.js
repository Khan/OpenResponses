const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// TODO(andy): This is a pretty hacky way to specify the human-readable flow names, but it'll do for now.
const humanReadableFlowNames = {
  humanities_ham_async: "The Cabinet Battle: State Debt",
  tiltedSquare_async: "Tilted Square Area",
  tiltedSquare_useMethod: "Tilted Square Area",
  humanities_resistance: "Martin Luther King Jr. and Malcolm X",
  zoid_01: "Shape Areas",
  naacp_rhetoric: "The Civil Rights Movement in Context",
};

const transporter = nodemailer.createTransport(functions.config().smtp.url);

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
        rejectedUserID.child("log").push({
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
        revieweeRef.child("log").push({
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
      .push({
        type: "creation",
        time: admin.database.ServerValue.TIMESTAMP,
      })
      .then(() => {
        const humanReadableFlowName =
          humanReadableFlowNames[event.params.flowID];

        if (!humanReadableFlowName) {
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
              subject: `Welcome to ${humanReadableFlowName}!`,
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
                              humanReadableFlowNames[event.params.flowID];
                            // TODO(andy): Include a human-readable name of the flow.
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
