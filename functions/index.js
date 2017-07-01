const functions = require("firebase-functions");
const admin = require("firebase-admin");

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
        });
    });
  });
