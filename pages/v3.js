// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import shuffle from "lodash.shuffle";
import throttle from "lodash.throttle";
import scrollToComponent from "react-scroll-to-component";
import { css, StyleSheet } from "aphrodite";
import { resetKeyGenerator } from "slate";

import activities from "../lib/activities";
import findReviewees from "../lib/reviewee-requirement";
import PageContainer from "../lib/components/page-container";
import Prompt from "../lib/components/prompt";
import reportError from "../lib/error";
import sharedStyles from "../lib/styles";
import Thread, { PlaceholderThread } from "../lib/components/thread";
import Welcome from "../lib/components/welcome";
import { dataKind as quillDataKind } from "../lib/components/quill-rich-editor"; // TODO move
import { signIn } from "../lib/auth";
import {
  setConnectivityHandler,
  loadData,
  saveData,
  commitData,
  saveUserState,
} from "../lib/db";

import type { PromptData, Activity } from "../lib/activities";
import type { RichEditorData } from "../lib/components/rich-editor";

const getClassCodeFromURL = url => {
  return url.query.classCode;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

const databaseVersion = 3;
const nameForYou = "You"; // TODO: Needs to be student name.
const youAvatar = "aqualine-sapling"; // TODO

const engagementCardCount = 3;

//============================================================================================
// * TEST STAGE HERE *
const testStage = 0;
//============================================================================================

type UserID = string;
type ThreadKey = UserID; // for now...

type ThreadData = {
  posts: { [key: string]: PostData },
};

type PostData = {
  data: RichEditorData,
  submissionTimestamp: number,
  userID: UserID,
  userData: {
    avatar: string,
    pseudonym: string,
    name: string,
  },
};

type State = {
  ready: boolean,
  userID: ?string,

  activity: ?Activity,

  userData: Object, // TODO
  threads: { [key: ThreadKey]: ThreadData },
  pendingRichEditorData: { [key: ThreadKey]: RichEditorData }, // TODO sync to serve
  expandedThreads: ThreadKey[],
  partners: { [key: string]: { userID: UserID } },

  hasConnectivity: boolean,
  nextSaveRequestID: number,
  pendingSaveRequestIDs: { [key: mixed]: number },
  saveRequestTimeoutTime: number,

  connectivitySubscriptionCancelFunction: ?(void) => void,
};

type Props = {
  url: {
    query: any,
  },
};

export default class NeueFlowPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      ready: false,
      userID: null,

      activity: activities[getFlowIDFromURL(props.url)],

      userData: {},
      // threads: {},
      threads: {
        a: {
          posts: {
            a: {
              data: {
                kind: quillDataKind,
                rawData: `<p>I'm not sure what "franchise" means, or means in this context. But it looks like the woman is auctioning off a slave, maybe? Her hair wreath makes me think maybe she's an Allegorical figure - is *she* "franchise?" Because he is missing a leg, which seems unpleasant/inconvenient, I would guess this is a negative portrayal of slavery, and so a pro-message for freedom for all.</p>`,
              },
              submissionTimestamp: 1,
              userID: "a",
              userData: {
                avatar: "marcimus-red",
                pseudonym: "Eclair",
                name: "Bob Johnson",
              },
            },
            b: {
              data: {
                kind: quillDataKind,
                rawData: `<p>A strength of this response is…it provides two different ways to interpret the same image depending on ones perspective.</p>`,
              },
              submissionTimestamp: 2,
              userID: "b",
              userData: {
                avatar: "mr-pants",
                pseudonym: "Bombolini",
                name: "Jenny Jennerson",
              },
            },
          },
        },
        b: {
          posts: {
            a: {
              data: {
                kind: quillDataKind,
                rawData: `<p>The man in the image is portrayed sympathetically, with the woman appearing to advocate for him. He is also missing a leg, to emphasize the sacrifices he's made. I would say the artist definitely supported equal rights for freedmen.</p>
                <p>I'd say the message is "former slaves who fought in the civil war sacrificed much, and deserve more rights than they currently have".</p>`,
              },
              submissionTimestamp: 1,
              userID: "b",
              userData: {
                avatar: "duskpin-sapling",
                pseudonym: "Cream puff",
                name: "Bob Johnson",
              },
            },
          },
        },
        c: {
          posts: {
            a: {
              data: {
                kind: quillDataKind,
                rawData: `<p>I'm not sure what "franchise" means, or means in this context. But it looks like the woman is auctioning off a slave, maybe? Her hair wreath makes me think maybe she's an Allegorical figure - is *she* "franchise?" Because he is missing a leg, which seems unpleasant/inconvenient, I would guess this is a negative portrayal of slavery, and so a pro-message for freedom for all.</p>`,
              },
              submissionTimestamp: 1,
              userID: "c",
              userData: {
                avatar: "purple-pi",
                pseudonym: "Stollen",
                name: "Bob Johnson",
              },
            },
          },
        },
        d: {
          posts: {
            a: {
              data: {
                kind: quillDataKind,
                rawData: `<p>The man in the image is portrayed sympathetically, with the woman appearing to advocate for him. He is also missing a leg, to emphasize the sacrifices he's made. I would say the artist definitely supported equal rights for freedmen.</p>
                <p>I'd say the message is "former slaves who fought in the civil war sacrificed much, and deserve more rights than they currently have".</p>`,
              },
              submissionTimestamp: 1,
              userID: "d",
              userData: {
                avatar: "mr-pink-blue",
                pseudonym: "Strudel",
                name: "Bob Johnson",
              },
            },
            b: {
              data: {
                kind: quillDataKind,
                rawData: `<p>A strength of this response is…it provides two different ways to interpret the same image depending on ones perspective.</p>`,
              },
              submissionTimestamp: 2,
              userID: "b",
              userData: {
                avatar: "mr-pants",
                pseudonym: "Wheaties",
                name: "Jenny Jennerson",
              },
            },
          },
        },
      },
      expandedThreads: [],
      partners: { za: { userID: "a" }, zb: { userID: "b" } },
      pendingRichEditorData: {},

      hasConnectivity: true,
      nextSaveRequestID: 0,
      pendingSaveRequestIDs: {},
      saveRequestTimeoutTime: 0,

      connectivitySubscriptionCancelFunction: null,
    };
  }

  onSubmitWelcome = ({
    email,
    name,
    avatar,
    realName,
  }: {
    email: string,
    name: string,
    avatar: string,
    realName: ?string,
  }) => {
    this.setUserState({ email, profile: { name, avatar, realName } });
  };

  setUserState = (newUserState: Object) => {
    /*
    this.setState({ userState: { ...this.state.userState, ...newUserState } });

    return (async () => {
      const latestUserState = await saveUserState(
        getFlowIDFromURL(this.props.url),
        getClassCodeFromURL(this.props.url),
        this.state.userID,
        newUserState,
      );
      if (latestUserState) {
        this.setState({ userState: latestUserState });
      }
    })().catch(reportError);
    */
  };

  fetchInitialData = async () => {
    const activity = this.state.activity;
    if (!activity) {
      throw "Can't fetch initial data for null activity";
    }

    // TODO(andy): So... we really don't have any semblance of security, but this sure does make the lack of security more easily manipulated. At some point we'll want to think about actually restraining what users are able to modify in the database, but that's not appropriate in this prototyping stage.
    let activeUserID = this.props.url.query.userID;
    if (activeUserID) {
      // Sign in anonymously anyway. This will be a throwaway user; we'll still write to the UID in the query string.
      await signIn();
    } else {
      activeUserID = await signIn();
      Router.replace({
        ...this.props.url,
        query: { ...this.props.url.query, userID: activeUserID },
      });
    }

    this.setState(
      {
        userID: activeUserID,
        userData: {
          avatar: youAvatar,
          pseudonym: nameForYou,
          name: "Bob Johnson",
        },
      },
      () => {
        this.expandThreadForFlowStage();
        let newState = {
          ready: true,
          pendingRichEditorData: {
            // TODO: incorporate server data
            [activeUserID]: { kind: quillDataKind, rawData: "" },
          },
        };
        if (testStage >= 1) {
          newState = {
            threads: {
              ...this.state.threads,
              [activeUserID]: {
                posts: {
                  a: {
                    data: {
                      kind: quillDataKind,
                      rawData: `<p>I think the artist is in support of equal rights for freedmen because here are a number of reasons that are complex can this sysetm understand what I'm talking about or is this all jumbled oh dear what is happening.</p>`,
                    },
                    submissionTimestamp: 1,
                    userID: activeUserID,
                    userData: this.state.userData,
                  },
                },
              },
            },
            pendingRichEditorData: {},
          };
        }
        if (testStage >= 2) {
          newState = {
            ...newState,
            threads: {
              ...newState.threads,
              a: {
                posts: {
                  ...newState.threads["a"].posts,
                  za: {
                    data: {
                      kind: quillDataKind,
                      rawData: `<p>A strength of this response is…it provides two different ways to interpret the same image depending on ones perspective.</p>`,
                    },
                    submissionTimestamp: 1,
                    userID: activeUserID,
                    userData: this.state.userData,
                  },
                },
              },
            },
          };
        }
        if (testStage >= 3) {
          newState = {
            ...newState,
            threads: {
              ...newState.threads,
              b: {
                posts: {
                  ...newState.threads["b"].posts,
                  za: {
                    data: {
                      kind: quillDataKind,
                      rawData: `<p>A strength of this response is…it provides two different ways to interpret the same image depending on ones perspective.</p>`,
                    },
                    submissionTimestamp: 1,
                    userID: activeUserID,
                    userData: this.state.userData,
                  },
                },
              },
            },
          };
        }
        this.setState(newState, () => this.expandThreadForFlowStage());
      },
    );

    // TODO
    /*
    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const { inputs, userState } =
      (await loadData(flowID, classCode, activeUserID)) || {};

    this.setState(
      {
        ready: true,
        inputs: inputs || [],
        userState: userState || {},
        userID: activeUserID,
      },
      () => {
        if (
          activity.prompt.type === "jigsaw" &&
          (!inputs || !inputs[0] || inputs[0]._jigsawGroup === undefined)
        ) {
          const jigsawPromptData = activity.prompt;

          const jigsawGroupRandomData = new Uint8Array(1);
          window.crypto.getRandomValues(jigsawGroupRandomData);
          const jigsawGroup = Math.floor(
            jigsawGroupRandomData[0] / 255.0 * jigsawPromptData.groups.length,
          );

          this.onChange(0, {
            _jigsawGroup: jigsawGroup,
          });
        }
      },
    );
    await this.updateReviewees(initialPage);

    if (this.props.url.query.fallbackUser) {
      console.log("Creating fallback user");
      this.setUserState({ isFallbackUser: true });
    }*/
  };

  throttledSaveToServer = throttle(
    (index, newInputs) => {
      const saveDataAsync = async () => {
        const currentSaveRequestID = this.state.nextSaveRequestID;
        this.state.pendingSaveRequestIDs[currentSaveRequestID] =
          Date.now() + 1000;
        this.setState({
          nextSaveRequestID: currentSaveRequestID + 1,
          pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
        });
        return saveData(
          databaseVersion,
          getFlowIDFromURL(this.props.url),
          getClassCodeFromURL(this.props.url),
          this.state.userID,
          index,
          newInputs,
        )
          .then(() => {
            delete this.state.pendingSaveRequestIDs[currentSaveRequestID];
            this.setState({
              pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
            });
          })
          .catch(error => {
            console.error("Error on iteration ", currentSaveRequestID, error);
          });
      };

      setTimeout(() => {
        this.setState({
          saveRequestTimeoutTime: Date.now(),
        });
      }, 1100);

      saveDataAsync().catch(reportError);
    },
    1000,
    { trailing: false, leading: true },
  );

  updateReviewees = async (currentPage: number) => {
    if (!this.state.activity) {
      throw "Can't update reviewees for null activity";
    }
    const activity = this.state.activity;

    if (
      this.state.reviewees &&
      this.state.reviewees.length === activity.revieweeCount
    ) {
      return;
    }

    // TODO
    /*
    const thisUserJigsawGroup =
      this.state.inputs[0] && this.state.inputs[0]._jigsawGroup;
    const revieweeFetcher = findReviewees({
      matchAtPageNumber: 1,
      extractResponse: inputs =>
        inputs[0]._jigsawGroup !== undefined
          ? {
              ...inputs[0].pendingCardData,
              _jigsawGroup: inputs[0]._jigsawGroup,
            }
          : inputs[0].pendingCardData,
      revieweePageNumberRequirement: 0,
      sortReviewees: () => 0,
      findReviewees: ({ inputs, userState }, fetcher) => {
        const reviewees = [];
        for (var i = 0; i < activity.revieweeCount; i++) {
          const reviewee = fetcher(otherUserData => {
            const revieweeIsNew =
              reviewees.findIndex(
                existingReviewee =>
                  existingReviewee.userID === otherUserData.userID,
              ) === -1;

            const revieweeJigsawGroup = otherUserData.inputs[0]._jigsawGroup;
            const revieweeIsDifferentEnough =
              activity.prompt.type !== "jigsaw" ||
              (thisUserJigsawGroup !== revieweeJigsawGroup &&
                // No other existing reviewee has this jigsaw group
                reviewees.findIndex(
                  existingReviewee =>
                    existingReviewee.submission._jigsawGroup ===
                    revieweeJigsawGroup,
                ) === -1);
            return revieweeIsNew && revieweeIsDifferentEnough;
          });
          if (reviewee) {
            reviewees.push(reviewee);
          }
        }
        return reviewees;
      },
      flowName: getFlowIDFromURL(this.props.url),
    }).fetcher;
    const fetcherResponse = await revieweeFetcher(
      [currentPage, [], undefined],
      this.state.userID,
      getClassCodeFromURL(this.props.url),
      { inputs: this.state.inputs, userState: this.state.userState },
      false,
    );
    if (fetcherResponse) {
      const remoteData = fetcherResponse.remoteData || fetcherResponse;
      const newUserState = fetcherResponse.newUserState;
      this.setState({
        reviewees: remoteData.responses,
      });
      if (newUserState) {
        await this.setUserState(newUserState);
      }

      if (remoteData.responses.length < activity.revieweeCount) {
        setTimeout(() => this.updateReviewees(this.state.currentPage), 1000);
      }
    }
    */
  };

  threadContainsPostFromUser = (threadKey: ThreadKey, userID: UserID) =>
    this.state.threads[threadKey] &&
    Object.keys(this.state.threads[threadKey].posts).some(
      postKey => this.state.threads[threadKey].posts[postKey].userID === userID,
    );

  isInWorldMap = () => {
    const { userID, activity } = this.state;
    if (!activity) {
      throw "Can't evaluate whether user is in world map without a valid activity.";
    }
    if (!userID) {
      throw "Can't evaluate whether user is in world map without a valid user ID.";
    }

    return (
      Object.keys(this.state.partners).length >= activity.revieweeCount &&
      Object.keys(this.state.partners).every(partnerKey =>
        this.threadContainsPostFromUser(
          this.state.partners[partnerKey].userID,
          userID,
        ),
      )
    );
  };

  expandThreadForFlowStage = () => {
    const { userID, partners } = this.state;
    if (!userID) {
      throw "Can't expand thread without a valid user ID";
    }
    const sequence = [
      userID,
      ...Object.keys(partners)
        .sort()
        .map(partnerKey => partners[partnerKey].userID),
    ];
    const threadToExpand = sequence.find(
      threadKey => !this.threadContainsPostFromUser(threadKey, userID),
    );
    this.setState({
      expandedThreads: threadToExpand !== undefined ? [threadToExpand] : [],
    });
  };

  onChange = (index: number, newInputs: Object) => {
    if (!this.state.activity) {
      throw "Can't commit changes for a null activity";
    }

    this.throttledSaveToServer(index, newInputs);

    // TODO
    /*
    let { inputs } = this.state;
    if (inputs.length < index) {
      inputs = [...inputs, ...Array(index - inputs.length).fill({})];
    }
    this.setState({
      inputs: [
        ...inputs.slice(0, index),
        newInputs,
        ...inputs.slice(index + 1),
      ],
    });
    */
  };

  componentWillMount = () => {
    resetKeyGenerator();
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      const connectivitySubscriptionCancelFunction = setConnectivityHandler(
        newConnectivityValue =>
          this.setState({ hasConnectivity: newConnectivityValue }),
      );

      this.setState({
        connectivitySubscriptionCancelFunction,
      });
    })().catch(reportError);
  };

  componentWillUnmount = () => {
    this.state.connectivitySubscriptionCancelFunction &&
      this.state.connectivitySubscriptionCancelFunction();
  };

  onChangePendingRichEditorData = (
    threadKey: ThreadKey,
    newPendingPostRichEditorData: any,
  ) => {
    this.setState({
      pendingRichEditorData: {
        ...this.state.pendingRichEditorData,
        [threadKey]: newPendingPostRichEditorData,
      },
    });
  };

  onSubmit = (threadKey: ThreadKey) => {
    const submittedRichEditorData = this.state.pendingRichEditorData[threadKey];
    const newPendingRichEditorData = { ...this.state.pendingRichEditorData };
    delete newPendingRichEditorData[threadKey];

    const postKey = "z"; // TODO! ref.push instead...
    const timestamp = 10; // TODO! use server timestamp

    const { avatar, pseudonym, name } = this.state.userData;
    const wasInWorldMap = this.isInWorldMap();

    this.setState(
      {
        pendingRichEditorData: newPendingRichEditorData,
        threads: {
          ...this.state.threads,
          [threadKey]: {
            ...(this.state.threads[threadKey] || {}),
            posts: {
              ...((this.state.threads[threadKey] || {}).posts || {}),
              [postKey]: {
                data: submittedRichEditorData,
                submissionTimestamp: timestamp,
                userID: this.state.userID,
                userData: {
                  avatar,
                  pseudonym,
                  name,
                },
              },
            },
          },
        },
      },
      () => {
        setTimeout(() => {
          if (!wasInWorldMap) {
            this.expandThreadForFlowStage();
          }
        }, 100); // TODO remove blatant workaround for animation fighting with submit transition
      },
    );
  };

  onSetIsExpanded = (threadKey: ThreadKey, newIsExpanded: boolean) => {
    this.setState({ expandedThreads: newIsExpanded ? [threadKey] : [] });
  };

  onSelectPrompt = (threadKey: ThreadKey, promptIndex: ?number) => {
    const activity = this.state.activity;
    if (!activity) {
      throw "Shouldn't have been able to select a prompt without an activity.";
    }

    this.setState({
      pendingRichEditorData: {
        ...this.state.pendingRichEditorData,
        [threadKey]: {
          kind: quillDataKind,
          rawData:
            promptIndex == null
              ? ""
              : activity.engagementPrompts[promptIndex].replace(/…$/, "&nbsp;"),
        },
      },
    });
  };

  render = () => {
    if (!this.state.ready || !this.state.userID) {
      // TODO(andy): Implement loading page.
      return null;
    }
    const userID: string = this.state.userID;

    const flowID = getFlowIDFromURL(this.props.url);
    if (!flowID) {
      return (
        <p>
          You need to specify an activity! Your URL should look like
          /?flowID=your_flow_id
        </p>
      );
    }

    if (!this.state.activity) {
      return (
        <p>
          There's no activity called {flowID}! Your URL should look like
          /?flowID=your_flow_id
        </p>
      );
    }
    const activity: Activity = this.state.activity;

    let prompt: PromptData;
    if (activity.prompt.type === "jigsaw") {
      throw "Unimplemented"; // TODO
      // prompt = activity.prompt.groups[jigsawGroup];
    } else {
      prompt = activity.prompt;
    }

    /*
    // TODO REENABLE
    if (!this.state.userState.email) {
      return (
        <Fragment>
          <Head>
            <style>
              {`
          body {
            background-color: ${sharedStyles.wbColors.offWhite};
          }
        `}
            </style>
          </Head>
          <PageContainer>
            <Welcome
              onSubmit={this.onSubmitWelcome}
              collectEmail
              title={this.state.activity.title}
              requiresRealName
            />
          </PageContainer>
        </Fragment>
      );
    }
    */

    const getThreadDataProps = (
      threadKey: ThreadKey,
      shouldShowClassmateFeedback: boolean,
    ) => {
      const threadData = this.state.threads[threadKey] || {};
      const posts = Object.keys(threadData.posts || {})
        .sort()
        .filter(
          postKey =>
            shouldShowClassmateFeedback ||
            threadData.posts[postKey].userID === userID ||
            threadData.posts[postKey].userID === threadKey, // TODO will need a more sophisticated test here if/when we make ThreadKey != UserID
        )
        .map(postKey => {
          const post = threadData.posts[postKey];
          return {
            data: post.data,
            avatar: post.userData.avatar,
            displayName: post.userData.pseudonym,
          };
        });
      const pendingRichEditorData = this.state.pendingRichEditorData[threadKey];
      return { posts, pendingRichEditorData };
    };

    const getThreadElement = (
      threadKey,
      isYou,
      pendingDisplayName,
      shouldShowClassmateFeedback,
    ) => (
      <Thread
        key={threadKey}
        {...getThreadDataProps(threadKey, shouldShowClassmateFeedback)}
        pendingAvatar={youAvatar}
        pendingDisplayName={pendingDisplayName}
        onChange={newData =>
          this.onChangePendingRichEditorData(threadKey, newData)}
        onSubmit={() => this.onSubmit(threadKey)}
        isExpanded={this.state.expandedThreads.includes(threadKey)}
        onSetIsExpanded={newIsExpanded =>
          this.onSetIsExpanded(threadKey, newIsExpanded)}
        prompts={
          isYou ? activity.reflectionPrompts : activity.engagementPrompts
        }
        onSelectPrompt={promptIndex =>
          this.onSelectPrompt(threadKey, promptIndex)}
        canAddReply={
          !this.threadContainsPostFromUser(threadKey, userID) ||
          (isYou && this.isInWorldMap())
        }
      />
    );

    const partnerThreadElement = partnerElementIndex => {
      const partners = Object.keys(this.state.partners)
        .sort()
        .map(partnerKey => this.state.partners[partnerKey]);
      const isUnlocked =
        partnerElementIndex === 0
          ? this.threadContainsPostFromUser(userID, userID)
          : partners.length >= partnerElementIndex &&
            this.threadContainsPostFromUser(
              partners[partnerElementIndex - 1].userID,
              userID,
            );
      if (isUnlocked) {
        if (partners[partnerElementIndex]) {
          return getThreadElement(
            partners[partnerElementIndex].userID,
            false,
            "Your reply",
            false,
          );
        } else {
          return (
            <PlaceholderThread
              key={partnerElementIndex}
              imageURL="/static/waiting@2x.png"
              title={`Waiting for another classmate to submit their response…`}
              secondaryText={
                partnerElementIndex === 0
                  ? "You'll look at a classmate's work next."
                  : undefined
              }
            />
          );
        }
      } else {
        return (
          <PlaceholderThread
            key={partnerElementIndex}
            imageURL="/static/lock@2x.png"
            title={`Partner #${partnerElementIndex + 1}`}
            secondaryText={
              partnerElementIndex === 0
                ? "You'll see a partner's work after you finish your own response."
                : undefined
            }
          />
        );
      }
    };

    const threadElements = Object.keys(this.state.threads)
      .filter(threadKey => threadKey !== userID)
      .map(threadKey => getThreadElement(threadKey, false, "Your reply", true));

    return (
      <Fragment>
        <Head>
          <style>
            {`
            body {
              background-color: ${sharedStyles.wbColors.offWhite};
            }
            @font-face{font-family:Lato;font-style:normal;font-weight:900;src:url('/static/fonts/Lato/Lato-Black.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:bold;src:url('/static/fonts/Lato/Lato-Bold.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:normal;src:url('/static/fonts/Lato/Lato-Regular.ttf');}
          `}
          </style>
        </Head>
        <PageContainer>
          <Prompt
            title={activity.title}
            prompt={prompt.prompt}
            stimuli={prompt.stimuli}
            postStimuliPrompt={prompt.postStimuliPrompt}
          />

          <div className={css(styles.yourThreadContainer)}>
            {getThreadElement(
              userID,
              true,
              this.threadContainsPostFromUser(userID, userID)
                ? "Reflect on what you've learned"
                : "Your response",
              true,
            )}
          </div>
          <div style={{ marginTop: 8, marginBottom: "100vh" }}>
            {this.isInWorldMap()
              ? threadElements
              : Array(activity.revieweeCount)
                  .fill(null)
                  .map((dummy, index) => partnerThreadElement(index))}
          </div>
        </PageContainer>
      </Fragment>
    );
  };
}

const styles = StyleSheet.create({
  yourThreadContainer: {
    position: "sticky",
    top: 0,
    marginTop: 8,
    marginBottom: 8,
    zIndex: 100,
    boxShadow: `0px 2px 3px rgba(33, 36, 44, 0.08)`,
  },
});
