// @flow
import React, { Fragment } from "react";
import { TransitionMotion, spring } from "react-motion";

import ResponseCard from "./response-card";
import sharedStyles from "../../styles";

type Card = {
  key: string,
  studentName: string,
  data: any, // TODO
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

const cardPeekHeight = 60;

const effectiveScreenWidth = () => window.innerWidth + 200;

export default class CardWorkspace extends React.Component {
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
    return {
      x: effectiveScreenWidth(),
      y: (this.props.pendingCards || []).length * -cardPeekHeight,
    };
  };

  willLeave = exitingStyle => {
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

  componentWillReceiveProps = nextProps => {
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

  render = () => {
    const currentCards = [
      ...this.props.submittedCards.map(c => ({ ...c, type: "submitted" })),
      ...this.props.pendingCards.map((c, i) => ({
        ...c,
        type: "pending",
        isActive: i === this.props.openPendingCard,
      })),
    ];
    return (
      <div
        style={{
          paddingBottom: this.props.pendingCards.length * cardPeekHeight,
        }}
      >
        <TransitionMotion
          willEnter={this.willEnter}
          willLeave={this.willLeave}
          didLeave={this.didLeave}
          styles={previousInterpolatedStyles =>
            currentCards.map(card => ({
              key: card.key,
              data: card,
              style:
                this.state.leavingKeys.size > 0
                  ? {
                      x: spring(effectiveScreenWidth()),
                      y: spring(
                        card.isActive
                          ? 0
                          : (this.props.pendingCards || []).length *
                            -cardPeekHeight,
                      ),
                    }
                  : {
                      x: spring(0),
                      y: spring(
                        this.props.openPendingCard !== null
                          ? card.isActive
                            ? this.state.pendingCardOffset
                            : this.props.pendingCards.length * -cardPeekHeight
                          : 0,
                      ),
                    },
            }))}
        >
          {interpolatedStyles => {
            return (
              <Fragment>
                {interpolatedStyles.map(({ data: card, key, style }) => {
                  const cardIsPending = card.type === "pending";
                  const pendingCardIndex = this.props.pendingCards.findIndex(
                    c => c.key === key,
                  );
                  const outerContainerStyle =
                    !cardIsPending || card.isActive
                      ? {
                          marginBottom: 16,
                          transform:
                            (card.isActive
                              ? `translateY(${this.state.pendingCardOffset -
                                  style.y}px)`
                              : "") + ` translateX(${style.x}px)`,
                        }
                      : {
                          position: "fixed",
                          bottom: style.y,
                          width: "100%",
                          maxWidth: 800,
                          height: 0,
                        };
                  return (
                    <div
                      style={outerContainerStyle}
                      key={key}
                      ref={ref => {
                        if (ref) {
                          this.refsByKey[key] = ref;
                        } else {
                          delete this.refsByKey[key];
                        }
                      }}
                    >
                      <div
                        style={
                          cardIsPending && !card.isActive
                            ? {
                                position: "absolute",
                                top:
                                  (this.props.pendingCards.length -
                                    this.props.pendingCards.findIndex(
                                      c => c.key === key,
                                    )) *
                                  -cardPeekHeight,
                                width: "100%",
                              }
                            : {}
                        }
                      >
                        <ResponseCard
                          studentName={card.studentName}
                          data={card.data}
                          placeholder={card.placeholder}
                          {...(cardIsPending
                            ? {
                                onChange: this.props.onChangePendingCardData,
                                onSubmit: this.props.onSubmitPendingCard,
                                onFocus: () =>
                                  this.props.onOpenPendingCard(
                                    pendingCardIndex,
                                  ),
                                submitTitle: this.props.submitButtonTitle,
                              }
                            : {})}
                        />
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          }}
        </TransitionMotion>
      </div>
    );
  };
}
