// @flow
import * as React from "react";
import { TransitionMotion, spring } from "react-motion";

import ResponseCard from "./response-card";
import sharedStyles from "../../styles";

type Card = {
  key: string,
  studentName: string,
  avatar: string,
  data: any, // TODO
  placeholder: ?string,
};

type Props = {
  submittedCards: Card[],
  pendingCards: Card[],
  openPendingCard: ?number,

  submitButtonTitle: string,

  onOpenPendingCard: number => void,
  onChangePendingCardData: any => void, // TODO
  onSubmitPendingCard: void => void,
};

const cardPeekHeight = 50;

const effectiveScreenWidth = () => window.innerWidth;

export default class CardWorkspace extends React.Component {
  refsByKey: { [key: string]: React.Ref<typeof React.Component> };

  constructor(props) {
    super(props);
    this.state = {
      positions: {},
      leavingKeys: new Set(),
      pendingCardOffset: 0,
    };
    this.refsByKey = {};
  }

  willEnter = enteringStyle => {
    console.log("now entering", enteringStyle.key);
    return {
      x: effectiveScreenWidth(),
      y: 0,
    };
  };

  willLeave = exitingStyle => {
    // We don't care about tracking inactive pending cards leaving.
    if (exitingStyle.data.type === "submitted" || exitingStyle.data.isActive) {
      this.setState(prevState => {
        if (!prevState.leavingKeys.has(exitingStyle.key)) {
          const newLeavingKeys = new Set(prevState.leavingKeys);
          console.log("now leaving", exitingStyle.key, Date.now());
          return {
            leavingKeys: newLeavingKeys.add(exitingStyle.key),
          };
        } else {
          return undefined;
        }
      });

      return {
        x: spring(-effectiveScreenWidth()),
        y: 0,
      };
    }
  };

  didLeave = exitedStyle => {
    this.setState(prevState => {
      if (prevState.leavingKeys.has(exitedStyle.key)) {
        const newLeavingKeys = new Set(prevState.leavingKeys);
        newLeavingKeys.delete(exitedStyle.key);
        console.log("now leaving", exitedStyle.key, Date.now());
        return {
          leavingKeys: newLeavingKeys,
        };
      } else {
        return undefined;
      }
    });
  };

  componentWillReceiveProps = (nextProps: Props) => {
    if (
      this.props.openPendingCard === null &&
      nextProps.openPendingCard !== null
    ) {
      let lastSubmittedCardY = 0;
      if (this.props.submittedCards.length > 0) {
        const lastSubmittedCardKey = this.props.submittedCards[
          this.props.submittedCards.length - 1
        ].key;
        lastSubmittedCardY = this.refsByKey[
          lastSubmittedCardKey
        ].getBoundingClientRect().bottom;
      }
      const pendingCardKey = this.props.pendingCards[nextProps.openPendingCard]
        .key;
      const pendingCardY = this.refsByKey[
        pendingCardKey
      ].getBoundingClientRect().top;
      this.setState({
        pendingCardOffset: pendingCardY - lastSubmittedCardY + 16,
      });
    }
  };

  getCardElement = (
    card: Card,
    isPending: boolean,
    pendingCardIndex: ?number,
  ) => {
    if (card.key === "conclusion") {
      return (
        <div
          onClick={() =>
            window
              .open("https://goo.gl/forms/iaXkFNESHi1llkvV2", "_blank")
              .focus()}
        >
          <ResponseCard
            placeholder={
              "🎉 You've finished!\n\n👀 Peers' replies to your work will appear above.\n\n🙏 Help us improve! Tap here to take a quick survey?"
            }
            isPeeking={true}
          />
        </div>
      );
    } else {
      return (
        <ResponseCard
          studentName={card.studentName}
          avatar={card.avatar}
          data={card.data}
          placeholder={card.placeholder}
          isPeeking={isPending && !card.isActive}
          {...(isPending
            ? {
                onChange: this.props.onChangePendingCardData,
                onSubmit: this.props.onSubmitPendingCard,
                onFocus: () => this.props.onOpenPendingCard(pendingCardIndex),
                submitTitle: this.props.submitButtonTitle,
              }
            : {})}
        />
      );
    }
  };

  render = () => {
    const currentCards = [
      ...this.props.submittedCards.map(c => ({ ...c, type: "submitted" })),
      ...this.props.pendingCards.map((c, i) => ({
        ...c,
        type: "pending",
        isActive: i === this.props.openPendingCard,
      })),
    ];

    const updateRef = key => ref => {
      if (ref) {
        this.refsByKey[key] = ref;
      } else {
        delete this.refsByKey[key];
      }
    };

    const pendingCardStackHidingY = -300;

    return (
      <div
        style={{
          paddingBottom: "70vh",
        }}
      >
        <TransitionMotion
          willEnter={this.willEnter}
          willLeave={this.willLeave}
          didLeave={this.didLeave}
          styles={previousInterpolatedStyles => {
            const output = [
              {
                key: "pendingCardStack",
                style: {
                  y: spring(
                    this.state.leavingKeys.size > 0
                      ? pendingCardStackHidingY
                      : this.props.openPendingCard !== null
                        ? pendingCardStackHidingY
                        : 0,
                  ),
                },
              },
            ].concat(
              currentCards.map(card => ({
                key: card.key,
                data: card,
                style:
                  this.state.leavingKeys.size > 0
                    ? {
                        x: spring(effectiveScreenWidth()),
                        y: spring(0),
                      }
                    : {
                        x: spring(0),
                        y: spring(
                          card.isActive
                            ? this.state.pendingCardOffset
                            : pendingCardStackHidingY,
                        ),
                      },
              })),
            );
            console.log("---");
            for (let o of output) {
              console.log(o);
            }
            return output;
          }}
        >
          {interpolatedStyles => {
            return (
              <React.Fragment>
                {interpolatedStyles.map(({ data: card, key, style }) => {
                  if (key === "pendingCardStack") {
                    return null;
                  }
                  const cardIsPending = card.type === "pending";
                  if (cardIsPending && !card.isActive) {
                    return null;
                  }
                  // Don't render incoming cards when cards are still leaving.
                  if (style.x > 0 && this.state.leavingKeys.size > 0) {
                    return null;
                  }
                  return (
                    <div
                      style={{
                        marginBottom: 16,
                        transform:
                          (card.isActive
                            ? `translateY(${this.state.pendingCardOffset -
                                style.y}px)`
                            : "") + ` translateX(${style.x}px)`,
                      }}
                      ref={updateRef(key)}
                      key={key}
                    >
                      {this.getCardElement(
                        card,
                        cardIsPending,
                        this.props.pendingCards.findIndex(c => c.key === key),
                      )}
                    </div>
                  );
                })}
                <div
                  style={{
                    position: "fixed",
                    bottom: interpolatedStyles.find(
                      s => s.key === "pendingCardStack",
                    ).style.y,
                    width: "100%",
                    maxWidth: 800,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {interpolatedStyles.map(({ data: card, key, style }) => {
                    if (key === "pendingCardStack") {
                      return null;
                    }
                    if (card.type !== "pending" || card.isActive) {
                      return null;
                    }
                    const pendingCardIndex = this.props.pendingCards.findIndex(
                      c => c.key === key,
                    );
                    return (
                      <div
                        style={{
                          width: "100%",
                        }}
                        ref={updateRef(key)}
                        key={key}
                      >
                        {this.getCardElement(card, true, pendingCardIndex)}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          }}
        </TransitionMotion>
      </div>
    );
  };
}
