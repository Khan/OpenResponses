// @flow

import type { Markdown } from "./components/neue/markdown";
import type { Stimulus } from "./components/neue/prompt";

type Activity = {
  title: string,
  prompt: Markdown,
  stimuli: Stimulus[],
  postStimuliPrompt: ?Markdown,

  engagementPrompts: string[],
  reflectionPrompts: string[],

  revieweeCount: number,
};

const activities: { [key: string]: Activity } = {
  reconstruction: {
    title: "Reconstruction and life after the Civil War",
    prompt: `Analyze the cartoon, and answer these questions:
  
  1. What was the message of this cartoon?
  2. Would you say the artist supported or opposed equal rights for freedmen?`,
    stimuli: [
      {
        imageURL: "http://andymatuschak.org/Franchise.jpg",
      },
    ],
    postStimuliPrompt: `Caption: FRANCHISE. AND NOT THIS MAN?
              
  Source: Thomas Nast was a political cartoonist who drew for a New York magazine called Harper’s Weekly. He supported the North’s side during the Civil War. This cartoon was published in 1865.`,
    engagementPrompts: [
      "A strength of this response is…",
      "This could be stronger if…",
      "Someone might disagree, saying…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Before, I'd assumed that…",
      "Now I want to know…",
    ],

    revieweeCount: 2,
  },
};

activities.test = activities.reconstruction;

export default activities;
