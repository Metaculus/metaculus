import { browser } from "k6/browser";
import { check, sleep } from "k6";
import { parseHTML } from "k6/html";
import http from "k6/http";

// URL of the site to run stress tests against
const BASE_URL = __ENV.BASE_URL ?? "http://localhost:3000";

// Number of virtual users that will make requests with the browser (i.e. request all the other resources needed to render the main html: css, js, etc)
const UI_VUS = __ENV.UI_VUS ?? 5;
// Number of virtual users that will make a simple http request (REST API)
const API_VUS = __ENV.API_VUS ?? 50;
// NUmber of iterations roughly each user to do. This is multiplied with the number of users, as they are shared by the shared-iterations executor
// (see more: https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/shared-iterations/)
const ITERATIONS_PER_VU = __ENV.ITERATIONS_PER_VU ?? 5;
// Maximum duration for the stress test to run
const MAX_DURATION = __ENV.MAX_DURATION ?? "60s";

// Token used to authenticate the Metaculus user used to post predictions on a question
const METACULUS_API_TOKEN = __ENV.METACULUS_API_TOKEN ?? "not-set";

export const options = {
  scenarios: {
    questionDetailsPage: {
      executor: "shared-iterations",
      vus: UI_VUS,
      iterations: ITERATIONS_PER_VU * UI_VUS,
      maxDuration: MAX_DURATION,
      exec: "questionDetailsPage",
      startTime: "0s",
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    questionsListFeedPage: {
      executor: "shared-iterations",
      vus: UI_VUS,
      iterations: ITERATIONS_PER_VU * UI_VUS,
      maxDuration: MAX_DURATION,
      exec: "questionsListFeedPage",
      startTime: "0s",
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    questionsListAPI: {
      executor: "shared-iterations",
      vus: API_VUS,
      iterations: ITERATIONS_PER_VU * API_VUS,
      maxDuration: MAX_DURATION,
      exec: "questionsListAPI",
      startTime: "0s",
    },
    predictOnQuestionAPI: {
      executor: "shared-iterations",
      vus: API_VUS,
      iterations: ITERATIONS_PER_VU * API_VUS,
      maxDuration: MAX_DURATION,
      exec: "predictOnQuestionAPI",
      startTime: "0s",
    },
  },
};

export async function predictOnQuestionAPI() {
  const url = BASE_URL + "/api2/questions/349/predict/";
  const res = http.post(url, JSON.stringify({ prediction: 0.8 }), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${METACULUS_API_TOKEN}`,
    },
  });

  check(res, {
    "API /predict/ returned 201": (r) => r.status === 201,
  });
  sleep(0.5);
}

export async function questionsListAPI() {
  const url = BASE_URL + "/api2/questions/?offset=0&limit=20";
  const res = http.get(url);

  check(res, {
    "API questions list returned 200": (r) => r.status === 200,
    "API questions returned all requests questions": (r) =>
      r.json().results?.length === 20,
  });
  sleep(0.5);
}

export async function questionsListFeedPage() {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL + "/questions/"); // Will SpaceX land people on Mars before 2030?

    const sideBar = await page
      .locator("main > div > div.sticky.top-12")
      .textContent();

    const listOfQuestionsHTML = await page
      .locator("main > div > div.grow.overflow-x-hidden > div.flex.flex-col")
      .innerHTML();

    const listOfQuestionsTitles = parseHTML(listOfQuestionsHTML).find("a>h4");

    check(sideBar, {
      "Sidebar includes 'Feed Home'": (sideBar) =>
        sideBar.includes("Feed Home"),
      "Sidebar includes 'TOPICS' section": (sideBar) =>
        sideBar.includes("Topics"),
      "Sidebar includes 'CATEGORIES' section": (sideBar) =>
        sideBar.includes("categories"),
    });

    check(listOfQuestionsTitles, {
      "Rendered 10 questions": (listOfQuestionsTitles) =>
        listOfQuestionsTitles.size() >= 10,
    });
  } finally {
    await page.close();
  }
}

export async function questionDetailsPage() {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL + "/questions/349/"); // Will SpaceX land people on Mars before 2030?

    const titleH1 = await page.locator("main h1").textContent();
    check(titleH1, {
      "Question title renders": (h1) => h1.includes("Will SpaceX"),
    });

    const predictButton = await page.locator(
      "#prediction-section > div.mt-3 > div.flex.flex-col.items-center.justify-center > button"
    );

    check(predictButton, {
      "Predict Button renders": (button) => button.isVisible(),
    });
  } finally {
    await page.close();
  }
}
