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
