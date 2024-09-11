# Headless Rendering

We store here all the code required to run a backend service which runs a headless browser used to
take screenshots of web pages, or certain elements within those pages.

The service is based on [Microsoft Playwright](http://playwright.dev/) framework, which is wrapped
in a small FastAPI server to expose the screenshot via an HTTP API.

### Building and running locally:

Build the Docker image and run a container:
```
docker build -t metac-screenshot .
docker run -it -p9000:9000 metac-screenshot
```

If you want to use the service with the main project, set these env variables
(or modify Django settings):

```shell
DJANGO_STATIC_HOST = "http://host.docker.internal:8000"
SCREENSHOT_SOURCE_BASE_URL = "http://host.docker.internal:8000/questions/question_embed"
```

Use `curl` to get a screenshot:
```
 curl -X POST -H "Content-Type: application/json" -H "api_key: your_api_key_here" --data '{"url": "https://www.metaculus.com/questions/12923/people-living-in-liberal-democracies/", "selector": ".FanGraphSection-container>div>svg"}' http://localhost:9000/api/screen_shot/ --output screenshot.png
```

### Pushing and releasing the container to Heroku

Setup your local cmd line Heroku like [here](https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime) and then:

```
heroku container:login
heroku container:push -a metac-screenshot web
heroku container:release -a metac-screenshot web
```
