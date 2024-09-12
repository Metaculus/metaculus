## Stress testing simple scripts

These require [k6](https://grafana.com/docs/k6/latest/), so make sure to install that as explained in their documentation.

Please don't run them against the production environment.

### How to run:

```bash
MAX_DURATION=60s BASE_URL=https://dev.metaculus.com  METACULUS_API_TOKEN=<token_for_user_predicting> API_VUS=100 UI_VUS=10  ITERATIONS_PER_VU=5 K6_BROWSER_HEADLESS=true k6 run scripts/k6-stress/simple-stress.js
```
