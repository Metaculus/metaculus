import time

from playwright.sync_api import expect, sync_playwright

backend_process = None
frontend_process = None


def setup_all(cls):
    cls.playwright = sync_playwright().start()
    cls.browser = cls.playwright.chromium.launch(headless=True)
    cls.context = cls.browser.new_context(record_video_dir="videos")
    cls.context.tracing.start(screenshots=True, snapshots=True, sources=True)

    expect.set_options(timeout=2)


def teardown_all(cls):
    cls.context.tracing.stop(path="trace.zip")
    cls.browser.close()
    cls.playwright.stop()


class TestSimpleFunctionality:
    @classmethod
    def setup_class(cls):
        setup_all(cls)

    @classmethod
    def teardown_class(cls):
        teardown_all(cls)

    @classmethod
    def test_login(cls):
        context = cls.context
        page = context.new_page()
        page.on("console", lambda msg: print("[Browser console] ", msg.text))

        url = "http://localhost:3000/"
        page.goto(url)

        page.get_by_role("button", name="Log in").click()

        page.get_by_placeholder("username or email").fill("username_1")
        page.get_by_placeholder("password").fill("Test1234")
        page.get_by_role("button", name="Log in", exact=True).last.click()
        time.sleep(1)
        page.get_by_role("link", name="Questions", exact=True).click()
        page.get_by_role("button", name="Filter").click()
        page.get_by_role("button", name="Binary").click()
        page.get_by_role("button", name="Open").click()
        page.get_by_role("button", name="Done").click()

        page.close()
