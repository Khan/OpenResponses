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

          const activity = activities[flowID] || {};
          const targetPartnerCount = activity.revieweeCount || 2;
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

              if (a === "model") {
                return -1;
              } else if (b === "model") {
                return 1;
              }

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
                targetPartnerCount &&
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

exports.copyTemplateUsers = functions.database
  .ref("/{flowID}/{classCode}/users")
  .onCreate(event => {
    console.log("New class code!", event.params.flowID, event.params.classCode);
    const classCodeRef = event.data.ref.parent;
    return classCodeRef.parent
      .child("TEMPLATE")
      .once("value")
      .then(templateSnapshot => {
        if (!templateSnapshot) {
          console.log(`No template found for ${flowID}`);
          return;
        }

        const { users, threads } = templateSnapshot.val();
        return Promise.all([
          classCodeRef.child("users").update(users),
          classCodeRef.child("threads").update(threads),
        ]);
      });
  });

exports.logUserCreation = functions.database
  .ref("/{flowID}/{cohortID}/users/{userID}")
  .onCreate(event => {
    const { profile } = event.data.val();
    const { email } = profile || {};
    return event.data.ref
      .update({ createdAt: admin.database.ServerValue.TIMESTAMP })
      .then(() => {
        const humanReadableFlowName = activities[event.params.flowID].title;

        if (
          !humanReadableFlowName ||
          /stress/.test(event.params.cohortID) ||
          /TEMPLATE/.test(event.params.cohortID)
        ) {
          return;
        }

        const returnURL = `${functions.config().host.origin}/?flowID=${event
          .params.flowID}&classCode=${event.params.cohortID}&userID=${event
          .params.userID}`;
        return transporter.sendMail({
          from: "Khan Academy <noreply@khanacademy.org>",
          to: email,
          subject: `Welcome to “${humanReadableFlowName}”!`,
          text: `Just in case you need to switch to a different computer, click this URL to pick up where you left off: ${returnURL}`,
          html: `<p>Just in case you need to switch to a different computer, <a href="${returnURL}">click this link</a> to pick up where you left off.</p>`,
        });
      });
  });
