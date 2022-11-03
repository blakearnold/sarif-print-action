const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const util = require('util')

try {
  // `sarif_file` input defined in action metadata file
  const sarifFile = core.getInput('sarif_file');
  console.log(`Hello ${sarifFile}!`);

  const rawdata = fs.readFileSync(sarifFile);
  const sarifData = JSON.parse(rawdata);
  console.log(sarifData);
  // https://github.com/microsoft/sarif-tutorials/blob/main/samples/1-Introduction/simple-example.sarif
  for (const run of sarifData.runs) {
    for (const result of run.results) {
      console.log(util.inspect(result))
      const message = result.message.text
      const level = result.level
      for (const location of result.locations) {
        console.log(util.inspect(location))
        const pl = location.physicalLocation
        const fileName = pl.artifactLocation.url
        const line = pl.region.startLine
        // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#using-workflow-commands-to-access-toolkit-functions

        // https://github.com/actions/toolkit/tree/main/packages/core#annotations
        core.warning(message, {file: fileName, startLine: line})
      }
    }

  }
} catch (error) {
  core.setFailed(error.message);
}