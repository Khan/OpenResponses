const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// TODO(andy): This is a pretty hacky way to specify the human-readable flow names, but it'll do for now.
const humanReadableFlowNames = {
  humanities_ham_async: "The Cabinet Battle: State Debt",
};

const transporter = nodemailer.createTransport(functions.config().smtp.url);

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
        // TODO less hard-coded
        const otherStudentUserID =
          (otherStudentUserState.reviewee1 &&
            otherStudentUserState.reviewee1.userID) ||
          (otherStudentUserState.reviewee2 &&
            otherStudentUserState.reviewee2.userID);
        if (!otherStudentUserID) {
          throw new Error(`No reviewee student IDs for ${event.params.userID}`);
        }

        return event.data.ref.root
          .child(
            `${event.params.flowID}/${event.params
              .cohortID}/${otherStudentUserID}/inbox/`,
          )
          .push({
            feedback: event.data.val(),
            time: admin.database.ServerValue.TIMESTAMP,
            fromUserID: event.params.userID,
            fromModuleID: event.params.moduleID,
          })
          .then(() => {
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
                  returnURL = `${functions.config().host.origin}/?flowID=${event
                    .params.flowID}&classCode=${event.params
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
