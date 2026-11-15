# Headless Rendering

We store here all the code required to run a backend service which runs a headless browser used to
take screenshots of web pages, or certain elements within those pages.

The service is based on [Microsoft Playwright](http://playwright.dev/) framework, which is wrapped
in a small FastAPI server to expose the screenshot via an HTTP API.

### Building and running locally:

Build the Docker image and run a container:

```
docker build -t metaculus-screenshot .
docker run -it -e API_KEY="your-key" -p9000:9000 metaculus-screenshot
```

Use `curl` to get a screenshot:

```
 curl -X POST -H "Content-Type: application/json" -H "api_key: your-key" --data '{"url": "https://www.metaculus.com/questions/12923/people-living-in-liberal-democracies/", "selector": ".FanGraphSection-container>div>svg"}' http://localhost:9000/api/screen_shot/ --output screenshot.png
```

Or run the main project so it uses the screenshot service

```shell
SCREENSHOT_SERVICE_API_URL = "http://localhost:9000/api/screenshot"
SCREENSHOT_SERVICE_API_KEY = "your-key"

```

### Dashboard PDFs

Labor Hub and the Global Health Monitor export PDFs through `front_end/src/utils/hub_pdf.server.ts`. It asks this service to print `PUBLIC_APP_URL` plus the page path, so the service must be able to load that URL as an anonymous visitor:

- **Production** works as is.
- **PR previews** (`*.mtcl.cc`) sit behind Cloudflare Access, so the service prints the Access sign-in page instead of the dashboard. Previews need either an Access bypass for this service (its egress IPs, or the `MetaculusScreenshotBot` user agent) or a Cloudflare Access service token that the service sends as `CF-Access-Client-Id` / `CF-Access-Client-Secret`, only on requests to the target host.
- **Local** exports need `PUBLIC_APP_URL` to be reachable from wherever the service runs (for example a tunnel); `localhost` only works if the service runs on the same machine.
