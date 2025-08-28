// https://nextjs.org/docs/app/guides/testing/jest#optional-extend-jest-with-custom-matchers
import "@testing-library/jest-dom";

import { TextEncoder } from "util";
global.TextEncoder = TextEncoder;

// https://github.com/vercel/next.js/discussions/59041#discussioncomment-10043081
import "whatwg-fetch";
