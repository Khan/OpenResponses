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
) => {
  const students = [];
  for (let i = 0; i < numberOfStudents; i++) {
    const newStudent = {
      timesPicked: 0,
      choice: Math.random() < choiceAProbability ? "A" : "B",
    };

    const eligibleStudents = [...students].filter(
      s => s.timesPicked < maxTimesPicked,
    );

    eligibleStudents.sort((a, b) => {
      if (a.choice === newStudent.choice && b.choice !== newStudent.choice) {
        return 1;
      } else if (
        b.choice === newStudent.choice && a.choice !== newStudent.choice
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
      const selectedStudents = eligibleStudents.slice(0, maxFeedbackGiven);
      selectedStudents.forEach(s => s.timesPicked++);
      newStudent.choices = selectedStudents.map(s => s.choice);
    } else {
      newStudent.choices = ["dummy"];
    }

    students.push(newStudent);
  }
  return students;
};

export default class DistributionTestPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      choiceAProbability: 0.5,
      maxTimesPicked: 2,
      maxFeedbackGiven: 2,
    };
  }

  render() {
    const simulationResults = runSimulation(
      this.state.choiceAProbability,
      1000,
      this.state.maxTimesPicked,
      this.state.maxFeedbackGiven,
    );
    console.log(simulationResults);
    return (
      <div>
        <p>Assume students are picking between two choices, A and B:</p>
        <div>
          <label>
            Probability of choice A:
            {" "}
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
            # of times a response can be shown to another student:
            {" "}
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
            # of peers' work a student gives feedback on:
            {" "}
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
        <h4>
          Response distribution
        </h4>
        <p>
          The percentage of students who saw other students' work paired with theirs in a given way:
        </p>
        <table>
          <tbody>
            {Object.entries(
              simulationResults.reduce(
                (a, s) => {
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
                },
                {},
              ),
            )
              .sort()
              .map(([distribution, count]) => (
                <tr key={distribution}>
                  <td>{distribution}:</td>
                  <td>
                    {Number.parseFloat(
                      count / simulationResults.length * 100,
                    ).toFixed(2)}
                    % ({count} student{count > 1 ? "s" : ""})
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <h4>
          Feedback distribution
        </h4>
        <p>
          The percentage of students who got feedback from a given number of students:
        </p>
        <table>
          <tbody>
            {Object.entries(
              simulationResults.reduce(
                (a, s) => {
                  return { ...a, [s.timesPicked]: (a[s.timesPicked] || 0) + 1 };
                },
                {},
              ),
            ).map(([timesPicked, count]) => (
              <tr key={timesPicked.toString()}>
                <td>{timesPicked}:</td>
                <td>
                  {count / simulationResults.length * 100}
                  % (
                  {count}
                  {" "}
                  student
                  {count > 1 ? "s" : ""}
                  )
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
