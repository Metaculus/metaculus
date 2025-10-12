import io
import logging

import sentry_sdk
from decouple import config
from fastapi import Body, Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader
from playwright.async_api import async_playwright
from pydantic import BaseModel

API_KEY = config("API_KEY", default="your_api_key_here")
TRACING_ENABLED = config("TRACING_ENABLED", default=False, cast=bool)
BASE_URL = config("BASE_URL", default="https://www.metaculus.com")
SENTRY_ENABLED = config("SENTRY_ENABLED", default=False, cast=bool)
MAX_OPEN_PAGES = config("MAX_OPEN_PAGES", default=10, cast=int)

DEFAULT_WIDTH = 800
DEFAULT_HEIGHT = 600
MAX_WIDTH = 1920
MAX_HEIGHT = 1080
MIN_WIDTH = 400
MIN_HEIGHT = 300
DEFAULT_TIMEOUT_MS = 5000
PAGE_LOAD_TIMEOUT_MS = 15000
api_key_header = APIKeyHeader(name="api_key", auto_error=True)

if SENTRY_ENABLED:
    logging.info("Starting sentry")

    sentry_sdk.init(
        dsn="https://d5f1eff59cb84b7fa2124ea11c7ea58b@o1146290.ingest.sentry.io/4505125491703808",
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production,
        traces_sample_rate=1.0,
    )

app = FastAPI()
g_browser_instance = None

logging.basicConfig(level="INFO")

logger = logging.getLogger(__name__)


async def get_browser_context():
    global g_browser_instance
    if not g_browser_instance or not g_browser_instance.is_connected():
        logger.info("Creating a browser instance")
        playwright = await async_playwright().start()

        # TO enable remote debugging, use these lines
        # g_browser_instance = await playwright.chromium.launch(headless=True, args=["--remote-debugging-address=0.0.0.0", "--remote-debugging-port=9333"])
        # page = await g_browser_instance.new_page()
        # await page.goto("https://google.com") # you can replace this URL in the remote devtools
        # To open the devtools, open in Chrome this url: chrome://inspect/#devices, and add a new
        # device with localhost:9333 (or the IP of your container)
        g_browser_instance = await playwright.chromium.launch(headless=True)
    return g_browser_instance


@app.on_event("startup")
async def startup():
    await get_browser_context()


@app.on_event("shutdown")
async def shutdown():
    global g_browser_instance
    logger.info("Server shutting down")
    # For now, the closing of the browser is disabled because it hangs and I have no idea why
    # TODO: figure out why this hangs
    if g_browser_instance and False:
        logger.debug("Closing browser")
        await g_browser_instance.close()
        logger.info("Browser and context closed")
        g_browser_instance = None


async def check_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key


class ScreenshotRequest(BaseModel):
    url: str
    selector: str
    width: int | None = DEFAULT_WIDTH
    height: int | None = DEFAULT_HEIGHT
    selector_to_wait: str | None = None


def clamp(val, min, max):
    return max if val > max else min if val < min else val


@app.post("/api/screenshot/", dependencies=[Depends(check_api_key)])
async def screenshot(request_data: ScreenshotRequest = Body(...)):
    url = request_data.url
    selector = request_data.selector
    width = clamp(request_data.width, MIN_WIDTH, MAX_WIDTH)
    height = clamp(request_data.height, MIN_HEIGHT, MAX_HEIGHT)

    browser = await get_browser_context()

    if len(browser.contexts) >= MAX_OPEN_PAGES:
        raise HTTPException(status_code=429, detail="Too many calls")

    page = await browser.new_page()

    try:
        if width and height:
            await page.set_viewport_size({"width": width, "height": height})

        await page.goto(url, wait_until="load", timeout=PAGE_LOAD_TIMEOUT_MS)

        # Wait for a particular element in the page, specified by the request
        if request_data.selector_to_wait:
            await page.wait_for_selector(
                f"css={request_data.selector_to_wait}",
                state="visible",
                timeout=DEFAULT_TIMEOUT_MS,
            )

        # Wait for the element we will take the screenshot of
        screenshot_element = page.locator(selector)
        await screenshot_element.wait_for(state="visible", timeout=DEFAULT_TIMEOUT_MS)

        buffer = await screenshot_element.screenshot(timeout=DEFAULT_TIMEOUT_MS)
    except Exception as e:
        logger.exception(f"Screenshot generation failed for {url}")
        raise HTTPException(
            status_code=400, detail=f"Screenshot generation failed: {e}"
        )
    finally:
        await page.close()

    filename = "screenshot.png"
    content_type = "image/png"

    return StreamingResponse(
        io.BytesIO(buffer),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
