import re
import time
from typing import Any, cast

from playwright.sync_api import expect, sync_playwright

backend_process = None
frontend_process = None


def setup_all(cls):
    cls.playwright = sync_playwright().start()
    cls.browser = cls.playwright.chromium.launch(headless=True)
    cls.context = cls.browser.new_context()
    cls.context.tracing.start(screenshots=True, snapshots=True, sources=True)

    expect.set_options(timeout=200)


def teardown_all(cls):
    cls.context.tracing.stop(path="trace.zip")
    cls.browser.close()
    cls.playwright.stop()


def drag_slider(page, offset_px=80):
    """Drag the slider handle by offset_px (positive = right, negative = left)."""
    slider = page.get_by_role("slider")
    box = slider.bounding_box()
    assert box, "Slider handle should have bounding box"
    center_x = box["x"] + box["width"] / 2
    center_y = box["y"] + box["height"] / 2
    page.mouse.move(center_x, center_y)
    page.mouse.down()
    page.mouse.move(center_x + offset_px, center_y)
    page.mouse.up()
    time.sleep(0.3)


def login(page, base_url="http://localhost:3000/"):
    """Log in with username_1 / Test1234 on the given page."""
    page.goto(base_url)
    page.get_by_role("button", name="Log in").click()
    page.get_by_placeholder("username or email").fill("username_1")
    page.get_by_placeholder("password").fill("Test1234")
    page.get_by_role("button", name="Log in", exact=True).last.click()
    time.sleep(1)


class TestSimpleFunctionality:
    playwright = None
    browser = None
    context = None

    @classmethod
    def setup_class(cls):
        setup_all(cls)

    @classmethod
    def teardown_class(cls):
        teardown_all(cls)

    def teardown_method(self, method):
        context = cast(Any, self.__class__.context)
        if context is not None:
            for page in context.pages:
                page.close()
            context.clear_cookies()

    def test_login(self):
        context = cast(Any, self.__class__.context)
        assert context is not None
        page = context.new_page()
        page.on("console", lambda msg: print("[Browser console] ", msg.text))

        login(page)

        page.get_by_role("banner").get_by_role("link", name="Questions").click()
        page.get_by_role("button", name="Filter").click()
        page.get_by_role("button", name="Binary").click()
        page.get_by_role("button", name="Open").click()
        page.get_by_role("button", name="Done").click()

    def test_create_binary_forecast_via_ui(self):
        context = cast(Any, self.__class__.context)
        assert context is not None

        page = context.new_page()
        page.on("console", lambda msg: print("[Browser console] ", msg.text))

        login(page)
        page.get_by_role("banner").get_by_role("link", name="Questions").click()
        page.get_by_role("button", name="Filter").click()
        page.get_by_role("button", name="Binary").click()
        page.get_by_role("button", name="Open").click()
        time.sleep(1)
        page.get_by_role("button", name="Done").click()
        time.sleep(1)
        links = page.locator("a[href^='/questions/']")
        for i in range(links.count()):
            href = links.nth(i).get_attribute("href") or ""
            if re.match(r"/questions/\d+/", href):
                links.nth(i).click()
                break

        time.sleep(1)

        drag_slider(page, offset_px=80)

        slider = page.get_by_role("slider")
        value_div = slider.locator("div")
        predicted_value = value_div.inner_text()

        predict_button = page.get_by_role(
            "button", name=re.compile(r"(Predict|Save changes|Reaffirm)", re.IGNORECASE)
        ).first
        predict_button.click()

        time.sleep(1)
        page.reload()
        time.sleep(1)

        slider_after = page.get_by_role("slider")
        value_div_after = slider_after.locator("div")
        expect(value_div_after).to_have_text(predicted_value)
