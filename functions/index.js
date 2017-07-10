const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// TODO(andy): This is a pretty hacky way to specify the human-readable flow names, but it'll do for now.
const humanReadableFlowNames = {
  humanities_ham_async: "The Cabinet Battle: State Debt",
};

const transporter = nodemailer.createTransport(functions.config().smtp.url);

exports.logRejection = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/userState/pendingRejections")
  .onWrite(event => {
    if (!event.data.exists()) {
      return;
    }

    const user = event.data.ref.parent.parent;
    const log = user.child("log");
    return log.push({
      type: "rejection",
      time: admin.database.ServerValue.TIMESTAMP,
      userIDs: event.data.val(),
    });
  });

exports.logReviewers = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/userState/reviewees")
  .onWrite(event => {
    if (!event.data.exists()) {
      return;
    }

    const user = event.data.ref.parent.parent;
    const log = user.child("log");
    return log.push({
      type: "revieweeChange",
      time: admin.database.ServerValue.TIMESTAMP,
      reviewees: event.data.val(),
    });
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
    return log.push({
      type: "creation",
      time: admin.database.ServerValue.TIMESTAMP,
    });
  });

exports.transferFeedback = functions.database
  .ref("/{flowID}/{cohortID}/{userID}/inputs/submitted/{moduleID}/feedback")
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

    const moduleData = event.data.ref.parent;
    const submittedData = moduleData.parent;
    const inputs = submittedData.parent;
    const userData = inputs.parent;
    return userData
      .child("userState")
      .once("value")
      .then(otherStudentUserStateSnapshot => {
        const otherStudentUserState = otherStudentUserStateSnapshot.val();

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
              console.log("Submitted values", submittedValues);
              // Save the feedback to the receiver's inbox.
              return event.data.ref.root
                .child(
                  `${event.params.flowID}/${event.params
                    .cohortID}/${otherStudentUserID}/inbox/`,
                )
                .push({
                  feedback: event.data.val(),
                  submitted: submittedValues,
                  time: admin.database.ServerValue.TIMESTAMP,
                  fromUserID: event.params.userID,
                  fromModuleID: event.params.moduleID,
                })
                .then(() => {
                  // Email the student receiving the feedback.
                  return event.data.ref.root
                    .child(
                      `${event.params.flowID}/${event.params
                        .cohortID}/${otherStudentUserID}/userState/email`,
                    )
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
                            : ""}.\n\nRead it and continue the activity here: ${returnURL}`,
                          html: `<p>Another student has left you feedback on your work${humanReadableFlowName
                            ? ` for &ldquo;${humanReadableFlowName}.&rdquo;`
                            : "."}</p><p><a href="${returnURL}">Click here</a> to read it and continue the activity.</p>`,
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
