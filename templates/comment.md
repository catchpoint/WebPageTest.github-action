# WebPageTest Test Results
Automatically triggered by [WebPageTest](https://www.webpagetest.org)'s GitHub Action.

<% tests.forEach((test) => { %>
## Page Tested:<%- test.url %>
**Full test results: <%- test.testLink %>/**

![Image of waterfall](<%- test.waterfall %>)
<% }); %>