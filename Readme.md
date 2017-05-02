# Prototyping around supporting open-ended responses through peer learning

How can technology go beyond multiple choice and numerical input to support and leverage open-ended work? Taking cues from effective classroom practices, we explore activities which invite students to engage with each other’s work in the digital realm. Great classroom environments use elements of social learning with peers such as reflection, feedback, elaboration and synthesis.

We hope to provide access to these elements for students who don’t have access to a great classroom, and enhance these elements for the teachers and students who do. We’ve designed students’ interactions to help surface patterns in their ideas to teachers, authors, and researchers.

This is a [Khan Academy Long-term Research](https://khanacademy.org/research) project. For more, here are some posts on this topic from [our blog](https://klr.tumblr.com):

* [Amplifying open-ended questions](http://klr.tumblr.com/post/153878272318/amplifying-open-ended-questions)
* [Messy thought, neat thought](http://klr.tumblr.com/post/154784481858/messy-thought-neat-thought)
* [Surveying the open-ended response landscape](http://klr.tumblr.com/post/156063609578/surveying-the-open-ended-response-landscape)
* [Feedback is a gift](http://klr.tumblr.com/post/157770095858/feedback-is-a-gift)
* [Rich tasks crowdsourcing data for more rich tasks](http://klr.tumblr.com/post/158036182833/rich-tasks-crowdsourcing-data-for-more-rich-tasks)
* [How cool is your math?](http://klr.tumblr.com/post/158440196813/how-cool-is-your-math)
* [Will we still type math in the future?](http://klr.tumblr.com/post/158529401393/will-we-type-math-still-in-the-future)
* [Safely showing students how others see their work](http://klr.tumblr.com/post/158814741858/safely-showing-students-how-others-see-their-work)

# This repository

Warning: these are early scratches, very unlikely useful outside our group.

To get a local server going, first copy `env-config.sample.js` to `env-config.js` and fill in the keys (if you're a Khan Academy employee, [you can get our info from Phabricator](https://phabricator.khanacademy.org/K227)). Then:

```
yarn install
npm run dev
```

# Adding content

See `lib/flows/humanitiesA.js` for an example of a flow using this system. To add a new flow, add a new file to that folder, add an entry for it in `index.js` (copy the pattern that's already there), and navigate to `/?flowID=NAME_GIVEN_IN_INDEX`.

# Identity

You'll be automatically assigned a user ID when you visit a page. When developing flows, it might be helpful to pose as multiple users to enter various responses.

You can get a new ID by visiting `/signOut` then refreshing the flow page.

You can isolate one group of students from another group of students by passing an `classCode` argument in the URL, like this:

```
http://localhost:3000/?flowID=myFlow&classCode=OaklandHigh
```