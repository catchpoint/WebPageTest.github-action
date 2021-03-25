const WebPageTest = require("webpagetest");
const core = require("@actions/core");
const github = require('@actions/github');
const ejs = require('ejs');

const WPT_BUDGET = core.getInput('budget');
const WPT_API_KEY = core.getInput('apiKey');
const WPT_URLS = core.getInput('urls').split("\n");
const WPT_LABEL = core.getInput('label');
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const GH_EVENT_NAME = process.env.GITHUB_EVENT_NAME;

const runTest = (wpt, url, options) => {
    // clone options object to avoid WPT wrapper issue
    let tempOptions = JSON.parse(JSON.stringify(options));

    return new Promise((resolve, reject) => {
        core.info(`Submitting test for ${url}...`);
        wpt.runTest(url, tempOptions, async(err, result) => {
            try {
                if (result) {
                    core.debug(result);
                    return resolve({'result':result,'err':err});
                } else {
                    return reject(err);
                }
            } catch (e) {
                core.info(e);
            }
        })
    });
}

const retrieveResults = (wpt, testId) => {
    return new Promise((resolve, reject) => {
        wpt.getTestResults(testId, (err, data) => {
            if (data) {
                return resolve(data);
            } else {
                return reject(err);
            }
        });
    });
}
async function renderComment(data) {
    try {
        const octokit = github.getOctokit(GITHUB_TOKEN, {log: console});
        const context = github.context;
        let markdown = await ejs.renderFile('./templates/comment.md', data);
        markdown
            .replace(/\%/g, '%25')
            .replace(/\n/g, '%0A')
            .replace(/\r/g, '%0D')    

        //submit a comment
        await octokit.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.payload.pull_request.number,
            body: markdown
        });
    } catch (e) {
        core.setFailed(`Action failed with error ${e}`);
    }
}
async function run() {
    const wpt = new WebPageTest('www.webpagetest.org',WPT_API_KEY);

    //TODO: make this configurable
    let options = {
        "firstViewOnly": true,
        "runs": 1,
        "location": 'Dulles:Chrome',
        "connectivity": '4G',
        "pollResults": 5,
        "timeout": 240
    }
    if (WPT_BUDGET) {
        options.specs = require(WPT_BUDGET);
    }
    if (WPT_LABEL) {
        options.label = WPT_LABEL;
    }

    core.startGroup('WebPageTest Configuration');
    core.info(`WebPageTest settings: ${JSON.stringify(options, null, '  ')}`)
    core.endGroup();

    core.startGroup(`Testing urls in WebPageTest..`);
    //for our commit
    let runData = {};
    runData["tests"] = [];

    Promise.all(WPT_URLS.map(async url=> {
        try {
            await runTest(wpt, url, options)
                .then(async result => {
                    try {
                        if (result.result.testId) {
                            //test submitted with specs
                            core.info('Tests successfully completed for '
                                        + url +'. Full results at https://'
                                        + wpt.config.hostname + '/result/' + result.result.testId);
                            
                            if (GH_EVENT_NAME == 'pull_request') {
                                let testResults = await retrieveResults(wpt, result.result.testId);
                                let testData = {
                                    "url": testResults.data.url,
                                    "testLink": testResults.data.summary,
                                    "waterfall": testResults.data.median.firstView.images.waterfall
                                }
                                runData["tests"].push(testData);
                            }
                            // testspecs also returns the number of assertion fails as err
                            // > 0 means we need to fail
                            if (result.err && result.err > 0) {
                                if (result.err == 1) {
                                    core.setFailed('One performance budget not met.')
                                } else {
                                    core.setFailed(result.err + ' performance budgets not met.')
                                }
                            }
                            return;
                        } else if (result.result.data) {
                            //test was submitted without testspecs
                            core.info('Tests successfully completed for ' + url
                                +'. Full results at ' + result.result.data.summary);
                            
                            if (GH_EVENT_NAME == 'pull_request') {
                                let testResults = await retrieveResults(wpt, result.result.data.id);
                                let testData = {
                                    "url": testResults.data.url,
                                    "testLink": testResults.data.summary,
                                    "waterfall": testResults.data.median.firstView.thumbnails.waterfall
                                }
                                runData["tests"].push(testData);
                            }
                            return;
                        } else {
                            return;
                        }
                    } catch (e) {
                        core.setFailed(`Action failed with error ${e}`);
                    }
                    
                });
            } catch (e) {
                core.setFailed(`Action failed with error ${e}`);
            }
    })).then(() => {
        if (GH_EVENT_NAME == 'pull_request') {
            renderComment(runData);
        }
    });
    
    return;
}

run();