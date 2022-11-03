const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const util = require('util');

function buildMessage(result, rule) {
  out = ''
  out += rule.shortDescription.text
  out += '\n'
  out += rule.help.text
  out += '\n'
  out += 'precision: ' + rule.properties.precision
  out += '\n'
  out += 'security-severity: ' + rule.properties['security-severity']
  return out
}

try {
  // `sarif_file` input defined in action metadata file
  const sarifFile = core.getInput('sarif_file');
  console.log(`Hello ${sarifFile}!`);

  const rawdata = fs.readFileSync(sarifFile);
  const sarifData = JSON.parse(rawdata);
  console.log(sarifData);

  // https://github.com/microsoft/sarif-tutorials/blob/main/samples/1-Introduction/simple-example.sarif
  for (const run of sarifData.runs) {
    const rulesMap = new Map();
    for (const rule of run.tool.driver.rules) {
      rulesMap.set(rule.id, rule)
      //console.log(util.inspect(rule));
    }
    for (const result of run.results) {
      rule = rulesMap.get(result.ruleId)
      const level = result.level;
      for (const location of result.locations) {
        const pl = location.physicalLocation;
        const fileName = pl.artifactLocation.uri;
        const line = pl.region.startLine;
        const endLine = pl.region.endLine;
        // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#using-workflow-commands-to-access-toolkit-functions
        const message = buildMessage(result, rule)
        // https://github.com/actions/toolkit/tree/main/packages/core#annotations
        const annotation = {title: rule.shortDescription.text, file: fileName, startLine: line, endLine: endLine}
        const securitySeverity = parseFloat(rule.properties['security-severity'])
        if (securitySeverity >= 8) {
          core.error(message, annotation);
          //console.log("error " + message + " " + util.inspect(annotation));
        } else if (securitySeverity >= 4) {
          core.warning(message, annotation);
          //console.log("waring "+ message + " " + util.inspect(annotation));
        } else {
          core.notice(message, annotation);
          //console.log("notice "+ message  + " " + util.inspect(annotation));
        }
      }
    }

  }
} catch (error) {
  core.setFailed(error.message);
}