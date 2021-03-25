<p align="center"><img src="https://docs.webpagetest.org/img/wpt-navy-logo.png" alt="WebPageTest Logo" /></p>

# WebPageTest GitHub Action
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](/LICENSE)

WebPageTest's GitHub Action lets you automatically run tests against WebPageTest on code changes. You can set and enforce performance budgets, and have performance data automatically added to your pull requets to move the performance conversation directly into your existing development workflow.

**Features:**
- Automatically run WebPageTest against code changes
- Set and enforce budgets for any metric WebPageTest can surface (spoiler alert: there are a lot)
- Complete control over WebPageTest test settings (authentication, custom metrics, scripting, etc)
- Automatically create comments on new pull requests with key metrics, waterfall and more.

## Using the Action

1. Get a WebPageTest API Key and store it [as a secret in your repository's settings](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

![WPT_API_KEY Secret in repo settings](/images/wpt-action-api-secret.png)

2. Create a `.github/workflows/webpagetest-action.yml` file in your repository with the following settings:

```yml
on: [pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    name: WebPageTest Action
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        
      - name: WebPageTest
        uses: WPO-Foundation/webpagetest-github-action@main
        with:
          apiKey: ${{ secrets.WPT_API_KEY }}
          urls: |
            https://example.com/
            https://example.com/about
          label: 'GitHub Action Test'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

3. Open a Pull Request. WebPageTest's GitHub Action will run in the background and post a comment on your PR.

![Sample pull request comment](/images/wpt-action-sample-comment.png)

## Configuration
By default, WebPageTest's GitHub Action will run tests whenever the event (pull_request, push, etc) you specify in your workflow is triggered. (We recommend `pull_request`).

The tests will be run with the following WebPageTest settings:

- Location: Dulles, VA
- Browser: Chrome on a Motorola G4
- Connection Type: 3G connection
- Number of test run per URL: 3
- First view only (no repeat views tested)
- The test results will be checked every **5** seconds, up to a limit of **240s**. If no results are returned by then, the test will timeout and fail.
- Each test will be labeled with the label you provide via the `label` input. 

However, WebPageTest is capable of going _very_ deep, and the GitHub Action provides a number of configuration settings to help fine-tune your tests and even fail a pull request if performance budgets aren't met.

### Setting performance budgets
WebPageTest's GitHub Action uses the [WebPageTest API Wrapper for NodeJS](https://github.com/marcelduran/webpagetest-api) under the hood. The wrapper provides [test specs](https://github.com/marcelduran/webpagetest-api/wiki/Test-Specs) functionality that lets you set budgets on any of the metrics returned by the WebPageTest API.

The GitHub Action lets you provide a path to a specs JSON file using the `budget` input. If a specs file is included, WebPageTest's GitHub Action will test the results against the budgets you've defined. If any budget isn't met, the tests will fail and you'll be provided with links to dig into the full WebPageTest results to see what was slowing things down.

For example, given the following configuration:

```yml
on: [pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    name: WebPageTest Action
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        
      - name: WebPageTest
        uses: WPO-Foundation/webpagetest-github-action@main
        with:
          apiKey: ${{ secrets.WPT_API_KEY }}
          urls: |
            https://example.com/
            https://example.com/about
          label: 'GitHub Action Test'
          budget: 'wpt-budget.json'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

And a `wpt-budget.json` file containing:

```json
{
 "median": {
     "firstView": {
         "firstContentfulPaint": 1000
     }
 }   
}
```

WebPageTest would test each run's First Contentful Paint. If the First Contentful Paint fires in less than 1 second, the test passes; if not, the test would fail.

![Example of a WPT action failing the PR if a budget is exceeded](/images/wpt-action-fail-pr.png)

The specs format provides tremendous flexiblity in which metrics you want to budget against. For more information, check out [the official documentation](https://github.com/marcelduran/webpagetest-api/wiki/Test-Specs).
### Customizing your WebPageTest tests
There are a _lot_ of [options available in WebPageTest](https://github.com/marcelduran/webpagetest-api#test-works-for-runtest-method-only) to customize your test results, record custom metrics, or do advanced scripting and multi-page flows.

To give you the ability to customize you tests, the WebPageTest GitHub Action let's you provide the path to a JSON object with your test options, using the `wptOptions` input.

For example, given the following configuration:

```yml
on: [pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    name: WebPageTest Action
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        
      - name: WebPageTest
        uses: WPO-Foundation/webpagetest-github-action@main
        with:
          apiKey: ${{ secrets.WPT_API_KEY }}
          urls: |
            https://example.com/
            https://example.com/about
          label: 'GitHub Action Test'
          budget: 'wpt-budget.json'
          wptOptions: 'wpt-options.json'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

And a `wpt-options.json` file containing:

```json
{
    "runs": 1,
    "location": "Dulles:Chrome",
    "connectivity": "Cable",
    "blockAds": true
}
```

The defaults values for the number of runs, location, and connectivity type would all be overwritten by the settings specified here. In addition, any ads defined by https://adblockplus.org/ would be automatically blocked.