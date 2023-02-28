# WebPageTest Test Results

<% tests.forEach((test) => { %>
**Page Tested: <%- test.url %>**

**Full test results: <%- test.testLink %>**

| <% test.metrics.forEach((metric) => { %><%- metric.name %> | <% }); %>
| <% test.metrics.forEach((metric) => { %>--- | <% }); %>
| <% test.metrics.forEach((metric) => { %><%- metric.value %> | <% }); %>

<% }); %>