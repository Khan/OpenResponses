// @flow

import type { Markdown } from "./components/markdown";
import type { Stimulus } from "./components/prompt";

export type PromptData = {
  prompt: Markdown,
  stimuli?: Stimulus[],
  postStimuliPrompt?: Markdown,
};

type RegularPromptData = PromptData & { type: "default" };
type JigsawPromptData = {
  type: "jigsaw",
  groupNameHeadingPrefix: string,
  groups: (PromptData & { name: string })[],
};

export type Activity = {
  title: string,
  prompt: RegularPromptData | JigsawPromptData,

  engagementPrompts: string[],
  reflectionPrompts: string[],

  revieweeCount: number,
  flowVersion?: number,
};

const activities: { [key: string]: Activity } = {
  reconstruction: {
    title: "Reconstruction and life after the Civil War",
    prompt: {
      type: "default",
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
    },
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
    flowVersion: 2,
  },

  islam_spread: {
    title: "The spread of Islam",
    prompt: {
      type: "default",
      prompt:
        "In what ways might the similarities or differences between Christianity, Zoroastrianism, and Islam have contributed to the spread of Islam?",
    },
    engagementPrompts: [
      "A point about Zoroastrianism you might have missed is…",
      "A point about Christianity you might have missed is…",
      "This response taught me that…",
      "One counterargument to this response would be…",
      "Our teacher would probably reply saying…",
      "This response assumes that…",
    ],
    reflectionPrompts: [
      "Now that I've finished this activity, I want to learn more about…",
      "During this activity, I was surprised to learn that…",
      "After this activity, I'm left unsure about…",
    ],

    revieweeCount: 3,
    flowVersion: 2,
  },

  industrialization: {
    title: "The effects of Industrialization",
    prompt: {
      type: "jigsaw",
      groupNameHeadingPrefix:
        "This student was exploring Industrialization's effects on: ",
      groups: [
        "trade and trade networks",
        "social structures",
        "political systems",
        "labor systems",
      ].map(groupName => ({
        name: groupName,
        prompt: `The effects of Industrialization were far-reaching. 

What effects did Industrialization have on **${groupName}?** Use evidence to support your claim.
      
After you write your response, you’ll be matched with classmates who explored the effects Industrialization had on other areas.`,
      })),
    },

    engagementPrompts: [
      "I'm not sure what's meant by…",
      "This could be stronger if…",
      "Another effect would be…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Before, I'd assumed that…",
      "Now, I want to know…",
    ],

    revieweeCount: 3,
    flowVersion: 2,
  },

  progressivism: {
    title: "Entering the Progressive Era",
    prompt: {
      type: "default",
      prompt:
        "**A Nauseating Job, But It Must Be Done**, an image of Theodore Roosevelt, 1906",
      stimuli: [
        {
          imageURL: "/static/progressivism/progressivism.jpg",
        },
      ],
      postStimuliPrompt: `Answer 1, 2, and 3.

1. Briefly describe ONE perspective about politics in the period 1900-1920 expressed in the image. 
2. Briefly explain ONE specific cause that led to the change depicted in the image. 
3. Briefly explain ONE specific effect of the political developments referenced by the image.`,
    },
    engagementPrompts: [
      "A more significant cause would be…",
      "A more significant effect would be…",
      "Someone might disagree, saying…",
      "An important piece of context to add is…",
      "A point this response makes that I missed is…",
    ],
    reflectionPrompts: [
      "Now I think the most significant cause of all was…",
      "If I answered this again I'd focus on…",
      "I want to spend more time reviewing…",
    ],

    revieweeCount: 2,
    flowVersion: 2,
  },

  progressivism2: {
    title: "Entering the Progressive Era",
    prompt: {
      type: "default",
      prompt:
        "**A Nauseating Job, But It Must Be Done**, an image of Theodore Roosevelt, 1906",
      stimuli: [
        {
          imageURL: "/static/progressivism/progressivism.jpg",
        },
      ],
      postStimuliPrompt: `Answer 1, 2, and 3.

1. Briefly describe ONE perspective about politics in the period 1900-1920 expressed in the image. 
2. Briefly explain ONE specific cause that led to the change depicted in the image. 
3. Briefly explain ONE specific effect of the political developments referenced by the image.`,
    },
    engagementPrompts: [
      "A more significant cause would be…",
      "A more significant effect would be…",
      "Someone might disagree, saying…",
      "An important piece of context to add is…",
      "A point this response makes that I missed is…",
    ],
    reflectionPrompts: [
      "Now I think the most significant cause of all was…",
      "If I answered this again I'd focus on…",
      "I want to spend more time reviewing…",
    ],

    revieweeCount: 2,
  },
  modernera: {
    title: "Entering Modernity",
    prompt: {
      type: "default",
      prompt:
        "What were the most significant changes between the Early Modern Era and the Modern Era? The most significant things that stayed the same? Support your answer with at least 2 pieces of evidence.",
    },
    engagementPrompts: [
      "Someone might disagree, saying...",
      "One important detail to add to this response is...",
      "A point this response makes that I missed is...",
    ],
    reflectionPrompts: [
      "Now I think the most significant factor was…",
      "If I answered this again I'd focus on…",
      "I want to spend more time reviewing…",
    ],

    revieweeCount: 2,
    flowVersion: 2,
  },
  modernchina: {
    title: "China in the Modern Era",
    prompt: {
      type: "default",
      prompt:
        "What internal and external problems did China face in this period (Modern) and how did they respond?",
    },
    engagementPrompts: [
      "Someone might disagree, saying...",
      "One important detail to add to this response is...",
      "A point this response makes that I missed is...",
    ],
    reflectionPrompts: [
      "Now I think the most significant factor was…",
      "If I answered this again I'd focus on…",
      "I want to spend more time reviewing…",
    ],

    revieweeCount: 2,
    flowVersion: 2,
  },

  newdeal: {
    title: "Contextualizing the New Deal",
    prompt: {
      type: "default",
      prompt:
        "How did the historical context surrounding the New Deal influence its creation and its policies? Include at least two pieces of evidence.",
    },
    engagementPrompts: [
      "One important detail to add about this period is…",
      "One important detail to add about the people involved is…",
      "One important result of this context to add is…",
      "Someone might disagree, saying…",
      "Our teacher would probably reply saying…",
      "A point this response makes that I missed is…",
    ],
    reflectionPrompts: [
      "Now I think the most significant factor was…",
      "If I answered this again I'd focus on…",
      "I want to spend more time reviewing…",
    ],
    revieweeCount: 2,
    flowVersion: 2,
  },

  rubberband: {
    title: "A rubber band experiment",
    prompt: {
      type: "default",
      prompt:
        "A student is given a rubber band and asked to determine whether the relationship between the restoring force exerted by the rubber band and the amount it is stretched is the same as that of an ideal spring.  Describe an experimental procedure that the student could use to collect the necessary data, including all the equipment the student would need.",
    },
    engagementPrompts: [
      "One important part of experiementing is to...",
      "A point this response makes that I missed is...",
      "A better way to do this might be...",
    ],
    reflectionPrompts: [
      "If I answered this again, I'd focus on...",
      "I should spend some more time reviewing...",
      "I want to learn more about...",
    ],
    revieweeCount: 2,
    flowVersion: 2,
  },

  affective: {
    title: "Affective learning",
    prompt: {
      type: "default",
      prompt:
        "What should Khan Academy make its top priority to help students with *affective learning?*\n\nDescribe the project in a sentence or two and explain the connection to affective learning by identifying the belief you plan to support.",
    },
    engagementPrompts: [
      "Focusing on students' receptivity to that belief, one way to build on this idea would be…",
      "Focusing on students' participation in that belief, one way to build on this idea would be…",
      "Focusing on students accepting that belief, one way to build on this idea would be…",
      "Focusing on students incorporating that belief into their daily life, one way to build on this idea would be…",
      "A critic of this argument might say…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Now I would…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  protests: {
    title: "Protests in the United States",
    prompt: {
      type: "default",
      prompt:
        "Between 1945 and 1975, many African Americans engaged in civil rights protests. Analyze TWO causes and ONE effect of these protests.",
    },
    engagementPrompts: [
      "One cause I would add to this response is…",
      "One effect I would add to this response is…",
      "An alternative to this claim is…",
      "This response would be stronger if…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Now I want to know…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  colonies: {
    title: "Comparing early English settlements",
    prompt: {
      type: "default",
      prompt:
        "Between 1607 and 1705, how did the demographics of the Chesapeake and Southern colonies compare to the demographics of the New England colonies? Cite at least ONE similarity and ONE difference in your response.",
    },
    engagementPrompts: [
      "One similarity I would add to this response is…",
      "One difference I would add to this response is…",
      "An alternative to this claim is…",
      "This response would be stronger if…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Now I want to know…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  reformdbq: {
    title: "Reform movements of the 19th century",
    prompt: {
      type: "default",
      prompt:
        "The reform movements of the 19th century were a response to the excesses of the Industrial Revolution. Using the documents and your general knowledge of European history, assess the validity of this statement.",
      stimuli: [
        {
          imageURL: "/static/reformdbq/1.jpg",
        },
        {
          imageURL: "/static/reformdbq/2.jpg",
        },
        {
          imageURL: "/static/reformdbq/3.png",
        },
        {
          imageURL: "/static/reformdbq/4.png",
        },
        {
          imageURL: "/static/reformdbq/5.png",
        },
        {
          imageURL: "/static/reformdbq/6.png",
        },
        {
          imageURL: "/static/reformdbq/7.png",
        },
      ],
    },
    engagementPrompts: [
      "Another piece of outside specific factual information I'd add here is…",
      "One piece of evidence in the documents which could strengthen this argument is…",
      "Someone might disagree with this argument, saying…",
      "A point this response makes that I missed is…",
    ],
    reflectionPrompts: [
      "If I answered this again, I'd focus on…",
      "I want to spend more time reviewing…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  globalization: {
    title: "Examining the impact of economic globalization",
    prompt: {
      type: "default",
      prompt: `Answer 1, 2, and 3.

1. Briefly describe ONE institution that accelerated economic globalization in the second half of the twentieth century. 
2. Briefly explain ONE specific cause of economic globalization.
3. Briefly explain ONE specific effect of economic globalization.`,
    },
    engagementPrompts: [
      "I'd argue a more significant institution in globalization is…",
      "I'd argue a more significant cause is…",
      "I'd argue a more significant effect is…",
      "Someone might disagree, saying…",
    ],
    reflectionPrompts: [
      "I learned that…",
      "Now I want to know…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  greatelector: {
    title: "The advice of the Great Elector",
    prompt: {
      type: "default",
      prompt: `Read the following document, then answer the prompt below it.

**Frederick William, the Great Elector. Secret letter to his son and heir. 1667**
      
It is necessary that you conduct yourself as a good father to your people, that you love your subjects regardless of their religious convictions, and that you try to promote their welfare at all times. Work to stimulate trade everywhere, and keep in mind the population increase of the Mark of Brandenburg. Take advantage of the advice of the clergy and nobility as much as you can; listen to them and be gracious to them all, as befits one of your position; recognize ability where you find it, so that you will increase the love and affection of your subjects toward you. But it is essential that you always be moderate in your attitudes, in order not to endanger your position and lose respect. With those of your own station in life, be careful never to give way in matters of precedence and in all to which you are entitled; on the contrary, hold fast to the eminence of your superior position. Remember that one can lose one’s superior position if one allows too great pomposity and too great a show upon the part of members of the court. 

Be keenly interested in the administration of justice throughout your land. See to it that justice is maintained for the poor as well as for the rich without discrimination of any kind. See to it that lawsuits are carried out without delay, without procrastination, for in doing this, you will solidify your own position. 
      
Seek to maintain friendly relations with princes and the nobility of the Empire. Correspond with them frequently and maintain your friendship with them. Be certain not to give them cause for ill-will; try not to arouse emotions of jealousy or enmity, but be sure that you are always in a strong position to maintain your weight in disputes that may arise… 
      
It is wise to have alliances, if necessary, but it is better to rely on your own strength. You are in a weak position if you do not have the means and do not possess the confidence of the people. These are the things, God be praised, which have made me powerful since the time I began to have them. I only regret that in the beginning of my reign, I forsook these policies and followed the advice of others against my will.

**Why do you think Frederick gave this advice? Practice using context to understand the significance of his suggestions. Relate pieces of his advice to at least two pieces of specific factual information.**`,
    },
    engagementPrompts: [
      "One important detail about this period to add is…",
      "One important detail about this region to add is…",
      "This letter also relates to the larger pattern of…",
      "One important detail about Frederick to add is…",
      "A more significant part of the letter to consider is…",
    ],
    reflectionPrompts: [
      "If I answered this again, I'd focus on…",
      "I want to spend more time reviewing…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  wilsonpoints: {
    title: "The effectiveness of Wilson's 14 points",
    prompt: {
      type: "default",
      prompt: `Evaluate the effectiveness of [Wilson's 14 points](http://avalon.law.yale.edu/20th_century/wilson14.asp). Write a thesis, and be sure to support your argument with specific evidence demonstrating ways in which his points were successful *and* ways in which they were unsuccessful.`,
    },
    engagementPrompts: [
      "Another important piece of evidence in support of this argument is…",
      "One piece of evidence which contradicts this argument is…",
      "Another important detail about Wilson's points to include is…",
      "A clearer version of this thesis might be: ",
      "A critic of this argument might say…",
    ],
    reflectionPrompts: [
      "If I answered this again, I'd focus on…",
      "I want to spend more time reviewing…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  imperialismdbq: {
    title: "Expansionism at the turn of the century",
    prompt: {
      type: "default",
      prompt: `To what extent was late nineteenth-century and early twentieth-century United States expansionism a continuation of past United States expansionism and to what extent was it a departure?
      
Write a thesis. Be sure to support your argument by drawing specific evidence from at least three documents, ideally by quoting the relevant parts of the document or pointing to specific details of the image.

_There are eight documents below. Scroll to the right to see them all!_`,
      stimuli: [
        {
          imageURL: "/static/imperialismdbq/a.jpg",
        },
        {
          source:
            "Josiah Strong. _Our Country: Its Possible Future and Its Present Crisis._ New York: American Home Missionary Society, 1885.",
          text:
            "It seems to me that God, with infinite wisdom and skill, is training the Anglo-Saxon race for an hour sure to come in the world's future. … The unoccupied arable lands of the earth are limited, and will soon be takken. … Then will the world enter upon a new stage of its history — _the final competition of races, for which the Anglo-Saxon is being schooled._ … Then this race of unequalled energy, with all the majesty of numbers and the might of wealth behind it — the representative, let us hope, of the largest liberty, the purest Christianity, the highest civilization … will spread itself over the earth. If I read not amiss, this powerful race will move down upon Mexico, down upon Central and South America, out upon the islands of the sea, over upon Africa and beyond. And can any one dout that the result of this competition of races will be the 'survival of the fittest'?",
        },
        {
          source:
            "Alfred T. Mahan. _The Interest of America in Sea Power._ Boston: Little, Brown, 1897",
          text: `Is the United States… prepared to allow Germany to acquire the Dutch stronghold of Curacao, fronting the Atlantic outlet of both the proposed canals of Panama and Nicaragua? Is she prepared to acquiesce in any foreign power purchasing from Haiti a naval station on the Windward Passage, through which pass our steamer routes to the Isthmus? Would she acquiesce to a foreign protectorate over the Sandwich Islands [Hawaii] that great central station of the Pacific?
          
Whether they will or no, Americans must now look outward. The growing production of the country demands it. An increasing volume of public sentiment demands it. The position of the United States, between the two Old Worlds and the two great oceans, makes the same claim, which will soon be strengthened by the creation of the new link joining the Atlantic and Pacific. The tendency will be maintained and increased by the growth of the European colonies in the Pacific, by the advancing civilization of Japan, and by the rapid peopling of our Pacific Statics.…

Three things are needful: First, protection of the chief harbors, by fortifications and coast-defense ships. … Secondly, naval force ,the arm of offensive power, which alone enables a country to extend its influence outward. Thirdly, no foreign state should henceforth acquire a coaling position within three thousand miles of San Francisco. …`,
        },
        {
          source: "Platform of the American Anti-Imperialist League, 1899.",
          text: `… Much as we abhor the war of "criminal aggression" in the Philippines, greatly as we regret that the blood of the Filipinos is on American hands, we more deeply resent the betrayal of American institutions at home …

Whether the ruthless slaughter of the Filipinos shall end next month or next year is but an incident in a contest that must go on until the Declaration of Independence and the Constitution of the United States are rescued from the hands of their betrayers. Those who dispute about standards of value while the foundation of the Republic is undermined will be listened to as little as those who would wrangle about the small economies of the household while the house is on fire. The training of a great people for a century, the aspiration for liberty of a vast immigration are forces that will hurl aside those who in the delirium of conquest seek to destroy the character of our institutions.`,
        },
        {
          source:
            "Senator Albert J. Beveridge. Speech to 56th Congress, _Congressional Record_. 1900.",
          text: `The Philippines are ours forever. … And just beyond the Philippines are China's illimitable markets. We will not retreat from either. We will not repudiate our duty in the archipelago. We will not abandon our opportunity in the Orient. We will not renounce our part in the mission of our race, trustee, under God, of the civilization of the world. And we will move forward to our work…with gratitude…and thanksgiving to Almighty God that He has marked us as His chosen people, henceforth to lead in the regeneration of the world. …

Our largest trade henceforth must be with Asia. The Pacific is our ocean. … And the Pacific is the ocean of the commerce of the future. … The power that rules the Pacific, therefore, is the power that rules the world. And, with the Philippines, that power is and will forever be the American Republic.
          `,
        },
        {
          source:
            "Theodore Roosevelt. Annual Message to Congress, December 6, 1904.",
          text: `It is not true that the United States feels any land hunger or entertains any projects as regards the other nations of the Western Bemisphere, save such as are for their welfare. All that this country desires is to see the neighboring countries stable, orderly, and prosperous. Any country whose people conduct themselves well can count upon our hearty friendship. If a nation shows that it knows how to act with reasonable efficiency and decency in social and political matters, if it keeps order and pays its obligations, it need fear no interference from the United States.

Chronic wrongdoing, or an impotence which results in a general loosening of the ties of civilized society, may in America, as elsewhere, ultimately require intervention by some civilized nation, and in the Western Hemisphere the adherence of the United States to the Monroe Doctrine may force the United States, however reluctantly, in flagrant cases of such wrongdoing or impotence, to the exercise of an international police power. If every country washed by the Caribbean Sea would show the progress in stable and just civilization which, with the aid of the Platt amendment, Cuba has shown since our troops left the island, and which so many of the republics in both Americas are constantly and brilliantly showing, all question of interference by this Nation with their affairs would be at an end.`,
        },
        {
          imageURL: "/static/imperialismdbq/g.jpg",
        },
        {
          source:
            "Supreme Court Decision. _Downes_ v. _Bidwell_, (one of the Insular Cases) 1901.",
          text: `We are also of opinion that the power to acquire territory by treaty implies, not only the power to govern such territory, but to prescribe upon what terms the United States will receive its inhabitants, and what their status shall be in what Chief Justice Marshall termed the "American empire." … Indeed, it is doubtful if Congress would ever assent to the annexation of territory upon the condition that its inhabitants, however foreign they may be to our habits, traditions, and modes of life, shall become at once citizens of the United States. In all its treaties hitherto the treaty-making power has made special provisions for this subject. … In all these cases there is an implied denial of the right of the inhabitants to American citizenship until Congress by further acti'on shall signify its assent thereto. …

It is obvious that in the annexation of outlying and distant possessions grave questions will arise from differences of race, habits, laws and customs of the people, and from differences of soil, climate and production, which may require action on the part of Congress that would be quite unnecessary in the annexation of contiguous territory, inhabited only by people of the same race, or by scattered bodies of native Indians.
          `,
        },
      ],
    },
    engagementPrompts: [
      "Another specific detail from the documents which would support this argument is…",
      "One specific detail from the documents which would contradict this argument is…",
      "A critic might disagree with your interpretation of one of the documents: ",
      "To tie your evidence more strongly into your argument, I would change…",
    ],
    reflectionPrompts: [
      "If I revised my answer, I would…",
      "I changed my mind about…",
    ],
    revieweeCount: 2,
  },

  ancientag: {
    title: "Agriculture before 600 B.C.E.",
    prompt: {
      type: "default",
      prompt: `Between 10,000 B.C.E. and 600 B.C.E., the adoption of agriculture had significant social, economic, and demographic effects.

In 5–8 sentences, develop an argument that evaluates how the adoption of agriculture in this time period affected the development of human societies. Be sure to include specific factual evidence supporting both what changed and what stayed the same.`,
    },
    engagementPrompts: [
      "Another important thing that changed was…",
      "Another important thing that stayed the same was…",
      "Another specific piece of evidence supporting this argument is…",
      "This response could use the same evidence to support its thesis better by…",
      "A critic of this argument might say…",
    ],
    reflectionPrompts: [],
    revieweeCount: 2,
  },

  coldwar: {
    title: "Eastern Europe's strategic place in the Cold War",
    prompt: {
      type: "default",
      prompt:
        "In 6–10 sentences, explain why the Soviet Union pursued the domination of Eastern Europe, including constructing the Berlin Wall. Make sure to include at least 3 pieces of specific historical evidence.",
    },
    engagementPrompts: [
      "Another specific piece of evidence that would support this argument is…",
      "Another important cause of the Soviet Union's domination of Eastern Europe is…",
      "This response could use the same evidence to support its thesis better by…",
      "A critic of this argument might say…",
    ],
    reflectionPrompts: [],
    revieweeCount: 2,
  },
};

// holdover from earlier tests, where I was relying on flow IDs being meaningless
activities.test = activities.reconstruction;

export default activities;
