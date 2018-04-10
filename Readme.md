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

To get a local server going, first copy `env.production.sample` to `env.production` and fill in the keys (if you're a Khan Academy employee, [you can get our info from Phabricator](https://phabricator.khanacademy.org/K227)). Then:

```
yarn install
npm run dev
```

To deploy the primary webserver, just run this command, and you'll get a unique accessible URL:

```
npm run deploy
```

To deploy the Google Cloud Functions associated with this app, run:

```
npm run deploy-functions
```

For email notifications to work, you'll have to run:

```
firebase functions:config:set smtp.url="smtp://user:password@your.smtpserver.net"
firebase functions:config:set host.origin="https://your.webserver.com"
```

# Adding content

See `lib/activities.js` for examples of a flow using this system. To add a new flow, add a new entry to that file (copy the pattern that's already there), and navigate to `/?flowID=NAME_GIVEN_IN_ACTIVITIES`.

# Identity

You'll be automatically assigned a user ID when you visit a page. When developing flows, it might be helpful to pose as multiple users to enter various responses.

You can pose as a user by passing their user ID in the `userID` argument in the URL.

You can isolate one group of students from another group of students by passing an `classCode` argument in the URL, like this:

```
http://YOUR-SERVER.com/?flowID=FLOW_ID&classCode=CLASS_CODE
```

Add `&fallbackUser=true` to the URL to become a user whose answer can be shown multiple times to another user, but only as a last resort. This is important for setting up new class codes.

# Reports

You can view a (very early) teacher-facing report at `http://YOUR-SERVER.com/report?flowID=FLOW_ID&classCode=CLASS_CODE`.

# Auto-populating a new class code with templated users.

You can create a `TEMPLATE` class code full of a few students to use as "dummy" responses to bootstrap a new class code.

1. Visit `http://YOUR-SERVER.com/?flowID=FLOW_ID&classCode=TEMPLATE`
2. Fill in a "dummy" student response.
3. Repeat #1 and #2 in an incognito window to make another dummy response if you like. Often we need one dummy response for each student category (e.g. a position on a historical argument).

Any new class codes with the same `flowID` will include those students.

## Model work

You can optionally create a user which will be assigned as a partner for _all_ students. The system will apply this behavior to new students in class codes where there's a student with a `userID` of `model`. To make a model student:

1. Visit `http://YOUR-SERVER.com/?flowID=FLOW_ID&classCode=SOME_CLASS_CODE&userID=model`
2. Submit a response.

If you'd like, you can use `TEMPLATE` as the class code to make a student whose work will become model work for all classes.

# URL scheme reference

Construct URLs by adding parameters onto the URL base like this:

```
https://YOUR-SERVER.com/url_base?param1=value1&param2=value2&param3=value
```

| URL base | Description | Audience |
| --- | --- | --- |
| `/` | Actually do the activity. | Students |
| `/report` | Display a report of all non-fallback-user activity. | Teachers |
| `/manage` | Display a few admin controls for the activity. | KA |
| `/distribution` | Not-very-self-explanatory simulator of peer interaction distributions in various what-if scenarios. | KA |


| URL parameter | Meaning |
| --- | --- |
| `flowID` | Chooses which flow (activity) is being displayed. Corresponds to pages in `lib/flows`. |
| `classCode` | Can be any arbitrary string. Creates isolated "pools" of students to set boundaries for peer exchange. |
| `userID` | Set this to a user's ID to "impersonate" that user. |

# Attributions

Lock icon by Dima Lagunov from the Noun Project.
Waiting icon by Leonardo Schneider from the Noun Project.
