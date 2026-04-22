from contextlib import asynccontextmanager
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
USER_AGENT = config(
    "USER_AGENT",
    default="MetaculusScreenshotBot/1.0 (+https://www.metaculus.com)",
)

DEFAULT_WIDTH = 800
DEFAULT_HEIGHT = 600
MAX_WIDTH = 1920
MAX_HEIGHT = 1080
MIN_WIDTH = 400
MIN_HEIGHT = 300
DEFAULT_TIMEOUT_MS = 5000
PAGE_LOAD_TIMEOUT_MS = 15000
PDF_READY_TIMEOUT_MS = 20000
DATA_LOADING_SELECTOR = '[data-loading="true"]'
SVG_STABLE_FRAME_COUNT = 5

# Chromium PDF default margin is 0; use sensible gutters for documents.
PDF_DEFAULT_MARGINS = {
    "top": "12.5mm",
    "right": "12.5mm",
    "bottom": "12.5mm",
    "left": "12.5mm",
}

api_key_header = APIKeyHeader(name="api_key", auto_error=True)

logging.basicConfig(level="INFO")

logger = logging.getLogger(__name__)

if SENTRY_ENABLED:
    logging.info("Starting sentry")

    sentry_sdk.init(
        dsn="https://d5f1eff59cb84b7fa2124ea11c7ea58b@o1146290.ingest.sentry.io/4505125491703808",
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production,
        traces_sample_rate=1.0,
    )

g_browser_instance = None


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


@asynccontextmanager
async def lifespan(_: FastAPI):
    await get_browser_context()
    yield

    global g_browser_instance
    logger.info("Server shutting down")
    # For now, the closing of the browser is disabled because it hangs and I have no idea why
    # TODO: figure out why this hangs
    if g_browser_instance and False:
        logger.debug("Closing browser")
        await g_browser_instance.close()
        logger.info("Browser and context closed")
        g_browser_instance = None


app = FastAPI(lifespan=lifespan)


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


class PdfPrintRequest(BaseModel):
    """Request body for print-style PDF (Chromium print-to-PDF, `print` CSS media)."""

    url: str
    selector_to_wait: str | None = None
    print_background: bool = True
    paper_format: str = "Letter"
    landscape: bool = False
    scale: float | None = None
    prefer_css_page_size: bool = False


def clamp(val, min, max):
    return max if val > max else min if val < min else val


async def wait_for_no_data_loading(page, timeout: int) -> None:
    await page.wait_for_function(
        """
        (selector) => document.querySelectorAll(selector).length === 0
        """,
        arg=DATA_LOADING_SELECTOR,
        timeout=timeout,
    )


async def wait_for_svg_stable(page, timeout: int) -> None:
    await page.wait_for_function(
        f"""
        () => {{
          const svgs = Array.from(document.querySelectorAll("svg"));
          const snapshot = svgs
            .map((svg) => {{
              const rect = svg.getBoundingClientRect();
              const pathCount = svg.querySelectorAll("path").length;
              return `${{Math.round(rect.width)}}x${{Math.round(rect.height)}}:${{pathCount}}`;
            }})
            .join("|");

          if (window.__pdfSvgSnapshot === snapshot) {{
            window.__pdfSvgStableFrames = (window.__pdfSvgStableFrames || 0) + 1;
          }} else {{
            window.__pdfSvgSnapshot = snapshot;
            window.__pdfSvgStableFrames = 0;
          }}

          return (window.__pdfSvgStableFrames || 0) >= {SVG_STABLE_FRAME_COUNT};
        }}
        """,
        timeout=timeout,
        polling="raf",
    )


async def wait_for_lazy_images_loaded(page, timeout: int) -> None:
    await page.evaluate(
        """
        async () => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const images = Array.from(document.querySelectorAll("img"));

          for (const img of images) {
            if (img.loading === "lazy") {
              img.loading = "eager";
            }
            img.scrollIntoView({ block: "center", inline: "center" });
            await sleep(10);
          }

          await Promise.all(
            images.map((img) =>
              new Promise((resolve) => {
                const done = () => resolve();

                if (img.complete) {
                  resolve();
                  return;
                }

                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              })
            )
          );

          await Promise.all(
            images.map((img) =>
              typeof img.decode === "function"
                ? img.decode().catch(() => {})
                : Promise.resolve()
            )
          );

          window.scrollTo(0, 0);
        }
        """
    )
    await page.wait_for_load_state("load", timeout=timeout)


# Chromium's page.pdf() does not fire beforeprint/afterprint (unlike Ctrl+P).
# We dispatch compatible events so client code runs before rasterization.
_DISPATCH_BEFORE_PRINT_JS = """
async () => {
  window.dispatchEvent(
    new Event("beforeprint", { bubbles: true, cancelable: false })
  );
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}
"""

_DISPATCH_AFTER_PRINT_JS = """
() => {
  window.dispatchEvent(
    new Event("afterprint", { bubbles: true, cancelable: false })
  );
}
"""


async def emit_beforeprint_for_pdf(page) -> None:
    await page.evaluate(_DISPATCH_BEFORE_PRINT_JS)


async def emit_afterprint_for_pdf(page) -> None:
    await page.evaluate(_DISPATCH_AFTER_PRINT_JS)


@app.post("/api/screenshot/", dependencies=[Depends(check_api_key)])
async def screenshot(request_data: ScreenshotRequest = Body(...)):
    url = request_data.url
    selector = request_data.selector
    width = clamp(request_data.width, MIN_WIDTH, MAX_WIDTH)
    height = clamp(request_data.height, MIN_HEIGHT, MAX_HEIGHT)

    browser = await get_browser_context()

    if len(browser.contexts) >= MAX_OPEN_PAGES:
        raise HTTPException(status_code=429, detail="Too many calls")

    context = await browser.new_context(user_agent=USER_AGENT)
    page = await context.new_page()

    try:
        if width and height:
            await page.set_viewport_size({"width": width, "height": height})

        response = await page.goto(url, wait_until="load", timeout=PAGE_LOAD_TIMEOUT_MS)

        if response and response.status >= 400:
            raise HTTPException(
                status_code=response.status,
                detail=f"Target page returned HTTP {response.status} for {url}",
            )

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
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Screenshot generation failed for {url}")
        raise HTTPException(
            status_code=400, detail=f"Screenshot generation failed: {e}"
        )
    finally:
        await page.close()
        await context.close()

    filename = "screenshot.png"
    content_type = "image/png"

    return StreamingResponse(
        io.BytesIO(buffer),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.post("/api/pdf/", dependencies=[Depends(check_api_key)])
async def pdf_print(request_data: PdfPrintRequest = Body(...)):
    url = request_data.url

    browser = await get_browser_context()

    if len(browser.contexts) >= MAX_OPEN_PAGES:
        raise HTTPException(status_code=429, detail="Too many calls")

    context = await browser.new_context(user_agent=USER_AGENT)
    page = await context.new_page()

    try:
        await page.set_viewport_size({"width": MAX_WIDTH, "height": MAX_HEIGHT})

        response = await page.goto(url, wait_until="load", timeout=PAGE_LOAD_TIMEOUT_MS)

        if response and response.status >= 400:
            raise HTTPException(
                status_code=response.status,
                detail=f"Target page returned HTTP {response.status} for {url}",
            )

        await wait_for_lazy_images_loaded(page, PDF_READY_TIMEOUT_MS)
        await wait_for_no_data_loading(page, PDF_READY_TIMEOUT_MS)
        if request_data.selector_to_wait:
            await page.wait_for_selector(
                f"css={request_data.selector_to_wait}",
                state="visible",
                timeout=PDF_READY_TIMEOUT_MS,
            )

        await emit_beforeprint_for_pdf(page)
        await wait_for_svg_stable(page, PDF_READY_TIMEOUT_MS)

        pdf_options = {
            "format": request_data.paper_format,
            "print_background": request_data.print_background,
            "landscape": request_data.landscape,
            "prefer_css_page_size": request_data.prefer_css_page_size,
            "margin": PDF_DEFAULT_MARGINS,
        }
        if request_data.scale is not None:
            pdf_options["scale"] = clamp(request_data.scale, 0.1, 2.0)

        try:
            buffer = await page.pdf(**pdf_options)
        finally:
            try:
                await emit_afterprint_for_pdf(page)
            except Exception:
                logger.debug("afterprint dispatch failed", exc_info=True)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"PDF generation failed for {url}")
        raise HTTPException(status_code=400, detail=f"PDF generation failed: {e}")
    finally:
        await page.close()
        await context.close()

    filename = "page.pdf"
    return StreamingResponse(
        io.BytesIO(buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
