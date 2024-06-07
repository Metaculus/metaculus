import { faTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

const Footer: FC = () => {
  return (
    <footer className="dark relative mx-auto my-0 flex w-full flex-wrap justify-center bg-blue-900 px-0 pb-0 pt-2 text-white">
      <div className="flex min-w-[300px] max-w-[400px] flex-1 flex-grow-[300px] justify-evenly px-4 pb-0 pt-4">
        <div className="mr-3">
          <ul>
            <li className="my-2">
              <a className="no-underline" href="/about/">
                About
              </a>
            </li>
            <li className="my-2">
              <a className="no-underline" href="/api">
                API
              </a>
            </li>
            <li className="my-2">
              <a className="no-underline" href="/otherinitiatives/">
                Other Initiatives
              </a>
            </li>
          </ul>
        </div>
        <div className="mr-3">
          <ul>
            <li className="my-2">
              <a className="no-underline" href="/help/faq">
                FAQ
              </a>
            </li>
            <li className="my-2">
              <a className="no-underline" href="/help/prediction-resources">
                Forecasting Resources
              </a>
            </li>
            <li className="my-2">
              <a className="no-underline" href="/press">
                Metaculus for Journalists
              </a>
            </li>
          </ul>
        </div>
        <div className="mr-3">
          <ul>
            <li className="my-2">
              <button ng-click="modals.setActive('contact-us')">Contact</button>
            </li>
            <li className="my-2">
              <a
                className="no-underline"
                href="https://apply.workable.com/metaculus"
              >
                Careers
              </a>
            </li>
            <li className="my-2">
              <a
                className="no-underline"
                href="https://twitter.com/metaculus"
                aria-label="Metaculus on Twitter"
              >
                <FontAwesomeIcon icon={faTwitter}></FontAwesomeIcon>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div id="newsletter-form"></div>

      <div className="w-full px-6 pb-0 pt-1 text-center lg:w-auto lg:pt-4 lg:text-left">
        <div className="text-xs text-gray-600-dark">
          <a
            className="my-1 inline px-2 no-underline lg:block lg:px-0"
            href="/help/guidelines/"
          >
            Guidelines
          </a>
          <a
            className="my-1 inline border-l border-gray-600-dark px-2 no-underline lg:block lg:border-0 lg:px-0"
            href="/privacy-policy/"
          >
            Privacy Policy
          </a>
          <a
            className="my-1 inline border-l border-gray-600-dark px-2 no-underline lg:block lg:border-0 lg:px-0"
            href="/terms-of-use/"
          >
            Terms of Use
          </a>
        </div>

        <form
          className="mt-2 text-xs text-gray-600-dark lg:mt-0"
          action=""
          method="post"
        >
          <button
            className="pr-2 hover:text-white lg:pr-1"
            type="submit"
            name="language"
            value="en-us"
          >
            English
          </button>
          <button
            className="border-l border-gray-600-dark pl-2 hover:text-white lg:pl-1"
            type="submit"
            name="language"
            value="cs"
          >
            Czech
          </button>
        </form>
      </div>

      <div className="mt-3 flex w-full items-center justify-around bg-gray-600-dark py-0.5 sm:py-1">
        <div>
          <a href="https://www.forbes.com/sites/erikbirkeneder/2020/06/01/do-crowdsourced-predictions-show-the-wisdom-of-humans/">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/Forbes.d977fa9e9196.png"
              alt="Forbes"
            ></img>
          </a>
        </div>
        <div>
          <a href="https://blogs.scientificamerican.com/observations/prediction-tools-can-save-lives-in-the-covid-19-crisis/">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/Scientific_American.7b92ecaf540e.png"
              alt="Scientific American"
            ></img>
          </a>
        </div>
        <div>
          <a href="https://time.com/5848271/superforecasters-covid-19/">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/time.51a0d6644179.png"
              alt="Time"
            ></img>
          </a>
        </div>
        <div>
          <a href="https://www.vox.com/future-perfect/2020/4/8/21210193/coronavirus-forecasting-models-predictions">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/vox.e0f55c55ae3c.png"
              alt="Vox"
            ></img>
          </a>
        </div>
        <div>
          <a href="https://news.yale.edu/2016/11/02/metaculus-prediction-website-eye-science-and-technology">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/yale.ce7e6c2b0f04.png"
              alt="Yale News"
            ></img>
          </a>
        </div>
        <div>
          <a href="https://www.nature.com/news/the-power-of-prediction-markets-1.20820">
            <img
              className="h-5 object-contain px-2 invert"
              src="https://d3s0w6fek99l5b.cloudfront.net/static/media/nature.b83b2c778bce.png"
              alt="Nature"
            ></img>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
