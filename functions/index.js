const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

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
    const otherStudentUserID = userData.child(
      "userState/otherStudentResponseUserID",
    );
    return otherStudentUserID.once("value").then(otherStudentUserIDSnapshot => {
      const otherStudentUserID = otherStudentUserIDSnapshot.val();
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
                // TODO(andy): Include a human-readable name of the flow.
                // TODO(andy): Shorten the flow URL?
                returnURL = `${functions.config().host.origin}/?flowID=${event
                  .params.flowID}&classCode=${event.params
                  .cohortID}&userID=${otherStudentUserID}`;
                return transporter.sendMail({
                  from: "Khan Academy <noreply@khanacademy.org>",
                  to: userEmailAddress,
                  subject: "You have new feedback available!",
                  text: `Another student has left you feedback on your work.\n\nRead it and continue the activity here: ${returnURL}`,
                  html: `<p>Another student has left you feedback on your work.</p><p><a href="${returnURL}">Click here</a> to read it and continue the activity.</p>`,
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
