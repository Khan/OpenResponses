import React from "react";

const flipChoice = choice => {
  switch (choice) {
    case "dummy":
      return "dummy";
    case "A":
      return "B";
    case "B":
      return "A";
  }
};

const runSimulation = (
  choiceAProbability,
  numberOfStudents,
  maxTimesPicked,
  maxFeedbackGiven,
  studentsPerDay,
  rejectProbability,
) => {
  const students = [];
  for (let i = 0; i < numberOfStudents; i++) {
    const newStudent = {
      timesPicked: 0,
      pickedBy: [],
      choice: Math.random() < choiceAProbability ? "A" : "B",
    };

    const eligibleStudents = [...students].filter(
      s => s.timesPicked < maxTimesPicked,
    );

    eligibleStudents.sort((a, b) => {
      if (a.choice === newStudent.choice && b.choice !== newStudent.choice) {
        return 1;
      } else if (
        b.choice === newStudent.choice &&
        a.choice !== newStudent.choice
      ) {
        return -1;
      }

      if (a.timesPicked < b.timesPicked) {
        return -1;
      } else if (a.timesPicked > b.timesPicked) {
        return 1;
      }

      return 0;
    });

    if (eligibleStudents.length >= 1) {
      const selectedStudents = [];
      while (selectedStudents.length < maxFeedbackGiven) {
        const prospectiveStudent = eligibleStudents.shift();
        if (!prospectiveStudent) {
          break;
        }
        prospectiveStudent.timesPicked++;
        if (Math.random() > rejectProbability) {
          prospectiveStudent.pickedBy.push(i);
          selectedStudents.push(prospectiveStudent);
        } else {
          console.log("Rejecting", eligibleStudents.length);
        }
      }
      console.log(selectedStudents.length, eligibleStudents.length);
      newStudent.choices = selectedStudents.map(s => s.choice);
    } else {
      newStudent.choices = ["dummy"];
    }

    students.push(newStudent);
  }
  return students;
};

const bucketSize = 60;
const bucketCount = 24;

export default class DistributionTestPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      choiceAProbability: 0.6,
      maxTimesPicked: 3,
      maxFeedbackGiven: 2,
      studentsPerDay: 100,
      rejectProbability: 0.02,
    };
  }

  render() {
    let simulationResults = runSimulation(
      this.state.choiceAProbability,
      this.state.studentsPerDay * 10 + this.state.maxFeedbackGiven * 2,
      this.state.maxTimesPicked,
      this.state.maxFeedbackGiven,
      this.state.studentsPerDay,
      this.state.rejectProbability,
    );
    simulationResults = simulationResults.slice(
      this.state.maxFeedbackGiven,
      simulationResults.length - this.state.maxFeedbackGiven,
    );
    console.log(simulationResults);
    return (
      <div>
        <p>Assume students are picking between two choices, A and B:</p>
        <div>
          <label>
            Probability of choice A:{" "}
            <input
              type="text"
              inputMode="numeric"
              value={this.state.choiceAProbability}
              onChange={e => {
                this.setState({
                  choiceAProbability: Number.parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <div>
          <label>
            # of times a response can be shown to another student:{" "}
            <input
              type="text"
              inputMode="numeric"
              value={this.state.maxTimesPicked}
              onChange={e => {
                this.setState({
                  maxTimesPicked: Number.parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <div>
          <label>
            # of peers' work a student gives feedback on:{" "}
            <input
              type="text"
              inputMode="numeric"
              value={this.state.maxFeedbackGiven}
              onChange={e => {
                this.setState({
                  maxFeedbackGiven: Number.parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <div>
          <label>
            # of students per day{" "}
            <input
              type="text"
              inputMode="numeric"
              value={this.state.studentsPerDay}
              onChange={e => {
                this.setState({
                  studentsPerDay: Number.parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <div>
          <label>
            Probability of student hitting "show me another student's work"
            button
            <input
              type="text"
              inputMode="numeric"
              value={this.state.rejectProbability}
              onChange={e => {
                this.setState({
                  rejectProbability: Number.parseFloat(e.target.value),
                });
              }}
            />
          </label>
        </div>
        <h4>Response distribution</h4>
        <p>
          The percentage of students who saw other students' work paired with
          theirs in a given way:
        </p>
        <table>
          <tbody>
            {Object.entries(
              simulationResults.reduce((a, s) => {
                const sortedChoices = [
                  ...s.choices.map(c => {
                    if (c === "dummy") {
                      return "dummy";
                    } else if (c === s.choice) {
                      return "agree";
                    } else {
                      return "disagree";
                    }
                  }),
                ].sort();
                return { ...a, [sortedChoices]: (a[sortedChoices] || 0) + 1 };
              }, {}),
            )
              .sort()
              .map(([distribution, count]) =>
                <tr key={distribution}>
                  <td>
                    {distribution}:
                  </td>
                  <td>
                    {Number.parseFloat(
                      count / simulationResults.length * 100,
                    ).toFixed(2)}
                    % ({count} student{count > 1 ? "s" : ""})
                  </td>
                </tr>,
              )}
          </tbody>
        </table>

        <h4>Feedback time distribution</h4>
        <p>How long a student has to wait before getting feedback</p>
        <table>
          <thead>
            <tr>
              <td />
              {Array(bucketCount).fill(0).map((unused, index) => {
                const style = { paddingRight: "1em" };
                const thisBucket = (index + 1) * bucketSize / 60;
                if (index === 0) {
                  return (
                    <td style={style}>
                      {"< "}
                      {thisBucket} hr
                    </td>
                  );
                } else if (index === bucketCount - 1) {
                  return (
                    <td style={style}>
                      {">= "}
                      {index * bucketSize / 60} hr
                    </td>
                  );
                } else {
                  return (
                    <td style={style}>
                      {index * bucketSize / 60}-{thisBucket}hr
                    </td>
                  );
                }
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              simulationResults.reduce((a, s, index) => {
                let output = { ...a };
                s.pickedBy.forEach((pickerIndex, responseIndex) => {
                  const studentsPassed = pickerIndex - index;
                  const daysPassed = studentsPassed / this.state.studentsPerDay;
                  const minutesPassed = daysPassed * 24 * 60; // lazy definition of day here
                  const minutesByBucket =
                    Math.ceil(minutesPassed / bucketSize) * bucketSize;
                  output[responseIndex] = {
                    ...output[responseIndex],
                    [minutesByBucket]:
                      ((output[responseIndex] || {})[minutesByBucket] || 0) + 1,
                  };
                });
                return output;
              }, {}),
            ).map(([responseIndex, histogram]) =>
              <tr key={responseIndex.toString()}>
                <td>
                  Feedback #
                  {Number.parseInt(responseIndex) + 1}
                  :
                </td>
                {Array(bucketCount).fill(0).map((unused, index) => {
                  const bucket = (index + 1) * bucketSize;
                  let value = histogram[bucket.toString()] || 0;
                  if (index === bucketCount - 1) {
                    value =
                      simulationResults.length -
                      Object.entries(histogram).reduce(
                        (a, [sumBucket, count], sumIndex) =>
                          a + (sumIndex >= index ? 0 : count),
                        0,
                      );
                  }
                  return (
                    <td key={index.toString()}>
                      {Number.parseFloat(
                        value / simulationResults.length * 100,
                      ).toFixed(1)}
                      %
                    </td>
                  );
                })}
              </tr>,
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
