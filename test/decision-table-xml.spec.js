/*
*  ©2017-2018 HBT Hamburger Berater Team GmbH
*  All Rights Reserved.
*/
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const chai = require('chai');
const moment = require('moment');
const expect = chai.expect;
const assert = chai.assert;

const { decisionTable, dateTime } = require('../index');

function readFile(filename) {
  return fs.readFileSync(path.resolve(__dirname, `${filename}`), { encoding: 'UTF-8' });
}

describe(chalk.blue('Parse and evaluate decision tables'), function() {

  it('Parse DRG', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test.dmn")).then(decisions => {
      expect(decisions).not.to.be.undefined;
      expect(decisions['decisionPrimary']).not.to.be.undefined;
      expect(decisions['decisionDependent']).not.to.be.undefined;
      expect(decisions['decisionUnknown']).to.be.undefined;
      done();
    }).catch(err => done(err));
  });

  it('Parse decision table', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-type-error.dmn")).then(decisions => {
      expect(decisions).not.to.be.undefined;
      done();
    }).catch(err => done(err));
  });

  it('Evaluation decision table', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test.dmn")).then(decisions => {
      expect(decisions['decisionDependent']).not.to.be.undefined;
      const context = {
        input: {
          category: "E",
          referenceDate: new Date("2018-01-04T00:00:00+00:00"),
        }
      };
      decisionTable.evaluateDecision('decisionDependent', decisions, context)
          .then(data => {
            expect(moment.isMoment(data.periodBegin)).to.be.true;
            expect(data.periodBegin.isSame(dateTime.date("2018-01-04"))).to.be.true;
            expect(moment.isMoment(data.periodEnd)).to.be.true;
            expect(data.periodEnd.isSame(dateTime.date("2018-04-04"))).to.be.true;
            done();
          }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with no matching rules', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-no-matching-rules.dmn")).then(decisions => {
      expect(decisions['decisionUnique']).not.to.be.undefined;
      expect(decisions['decisionCollect']).not.to.be.undefined;
      const context = {
        input: {
          input1: 1,
          input2: 2,
        }
      };
      decisionTable.evaluateDecision('decisionUnique', decisions, context).then(data => {
        expect(data).not.to.be.undefined;
        expect(data.output1).not.to.be.undefined;
        expect(data.output1.nested).to.be.undefined;
        expect(data.output2).to.be.undefined;
        decisionTable.evaluateDecision('decisionCollect', decisions, context).then(data => {
          expect(data).not.to.be.undefined;
          expect(data).to.have.ordered.members([]);
          done();
        }).catch(err => done(err));
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with required decision', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test.dmn")).then(decisions => {
      expect(decisions['decisionPrimary']).not.to.be.undefined;
      const context = {
        input: {
          category: "E",
          referenceDate: new Date("2018-01-04T00:00:00+00:00"),
          testDate: new Date("2018-01-03T00:00:00+00:00"),
        }
      };

      decisionTable.evaluateDecision('decisionPrimary', decisions, context).then(data => {
        expect(data.output.score).to.equal(50);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with required decision 2', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test.dmn")).then(decisions => {
      expect(decisions['decisionPrimary']).not.to.be.undefined;
      const context = {
        input: {
          category: "E",
          referenceDate: new Date("2018-01-04T10:00:00+00:00"),
          testDate: new Date("2018-04-04T10:00:00+00:00"),
        }
      };

      decisionTable.evaluateDecision('decisionPrimary', decisions, context).then(data => {
        expect(data.output.score).to.equal(100);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with required decision 3', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test.dmn")).then(decisions => {
      expect(decisions['decisionPrimary']).not.to.be.undefined;
      const context = {
        input: {
          category: "E",
          referenceDate: new Date("2018-01-04T10:00:00+00:00"),
          testDate: new Date("2018-04-05T00:00:00+00:00"),
        }
      };

      decisionTable.evaluateDecision('decisionPrimary', decisions, context).then(data => {
        expect(data.output.score).to.equal(0);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with hit policy COLLECT', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-collect.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          category: "A",
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        assert.deepEqual(data, [
          { message: 'Message 1', output: { property: 'Value 1' }},
          { message: 'Message 3', output: { property: undefined }},
          { message: undefined, output: { property: 'Value 4' }},
          { message: 'Message 5', output: { property: 'Value 5' }},
        ]);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with required decision of hit policy COLLECT', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-collect-drg.dmn")).then(decisions => {
      expect(decisions['decisionPrimary']).not.to.be.undefined;
      const context = {
        input: {
          category: "A",
        }
      };
      decisionTable.evaluateDecision('decisionPrimary', decisions, context).then(data => {
        expect(data.output.score).to.equal(50);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with hit policy RULE ORDER', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-rule-order.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          category: "A",
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        assert.deepEqual(data, [
          { message: 'Message 1' },
          { message: 'Message 3' },
          { message: 'Message 4' },
          { message: 'Message 5' },
        ]);
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with hit policy UNIQUE', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-unique.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          category: "B",
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        expect(data).not.to.be.undefined;
        expect(data.message).to.equal('Message 2');
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Return undefined if no rule matches', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-no-matching-rule.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          category: "D",
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        expect(data).not.to.be.undefined;
        expect(data.message).to.be.undefined;
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Enforce uniqueness for hit policy UNIQUE', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-unique.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          category: "A",
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        assert.fail(0, 1, "Uniqueness not enforced");
      }).catch(err => {
        expect(err.message).to.equal(`Decision "decision" is not unique but hit policy is UNIQUE.`);
        done();
      });
    }).catch(err => done(err));
  });

  it('Evaluation decision with arithmetic input expression', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-input-expression.dmn")).then(decisions => {
      expect(decisions['decision']).not.to.be.undefined;
      const context = {
        input: {
          score: 1,
        }
      };
      decisionTable.evaluateDecision('decision', decisions, context).then(data => {
        expect(data).not.to.be.undefined;
        expect(data.message).to.equal('Score 2');
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with special characters in text node', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-decode-special-characters.dmn")).then(decisions => {
      expect(decisions['test_decision']).not.to.be.undefined;
      const context = {
        reputationValue: 95,
      };
      decisionTable.evaluateDecision('test_decision', decisions, context).then(data => {
        expect(data.reputationText).to.equal('good');
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  // Will failed on startRule: 'SimpleUnaryTests', TODO pick or compose working rule
  // it('Evaluation decision table with input variable for functions', function(done) {
  //   decisionTable.parseDmnXml(readFile("./data/test-input-variable.dmn")).then(decisions => {
  //     expect(decisions['decision']).not.to.be.undefined;
  //     decisionTable.evaluateDecision('decision', decisions, { issue: { id: "CAM-1234" }}).then(data => {
  //       expect(data.projectName).to.equal('Camunda');
  //       done();
  //     }).catch(err => done(err));
  //   }).catch(err => done(err));
  // });

  it('Evaluation decision table with no input', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-empty-input.dmn")).then(decisions => {
      expect(decisions['noInput']).not.to.be.undefined;
      decisionTable.evaluateDecision('noInput', decisions, { }).then(data => {
        expect(data.output).to.equal("d'oh");
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });

  it('Evaluation decision table with no input and no rules', function(done) {
    decisionTable.parseDmnXml(readFile("./data/test-empty-decision.dmn")).then(decisions => {
      expect(decisions['noDecision']).not.to.be.undefined;
      decisionTable.evaluateDecision('noDecision', decisions, { }).then(data => {
        expect(data.output).to.be.undefined;
        done();
      }).catch(err => done(err));
    }).catch(err => done(err));
  });
});
