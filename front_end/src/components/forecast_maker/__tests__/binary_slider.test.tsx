import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { FC } from "react";

import messages from "../../../../messages/en.json";
import BinarySlider from "../binary_slider";
import {
  clampForecast,
  parseForecastInput,
  roundForecast,
} from "../forecast_text_input";

beforeAll(() => {
  // jsdom has no PointerEvent; back it with MouseEvent so clientX/clientY and
  // pointerType survive fireEvent, letting the move-threshold logic be tested.
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      pointerType: string;
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerType = params.pointerType ?? "";
      }
    }
    window.PointerEvent =
      PointerEventPolyfill as unknown as typeof PointerEvent;
    global.PointerEvent = window.PointerEvent;
  }

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  // rc-slider / community bubble guard reference ResizeObserver in some paths.
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

const EDIT_LABEL = "Enter probability";

const renderSlider = (onChange = jest.fn()) => {
  const Wrapper: FC = () => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <BinarySlider forecast={50} onChange={onChange} isDirty={false} />
    </NextIntlClientProvider>
  );
  render(<Wrapper />);
  return { onChange };
};

// Simulate a press that releases in place (a tap) on the thumb value. The
// editor opens on the browser-disambiguated `click` that follows.
const tapThumb = (target: HTMLElement) => {
  fireEvent.pointerDown(target, {
    clientX: 10,
    clientY: 10,
    pointerType: "mouse",
  });
  fireEvent.pointerUp(document, {
    clientX: 10,
    clientY: 10,
    pointerType: "mouse",
  });
  fireEvent.click(target, { clientX: 10, clientY: 10 });
};

describe("forecast input helpers", () => {
  it("parses, returning null for non-numeric input", () => {
    expect(parseForecastInput("65.5")).toBe(65.5);
    expect(parseForecastInput("abc")).toBeNull();
    expect(parseForecastInput("")).toBeNull();
  });

  it("clamps to the binary range", () => {
    expect(clampForecast(150, 0.1, 99.9)).toBe(99.9);
    expect(clampForecast(0, 0.1, 99.9)).toBe(0.1);
    expect(clampForecast(42, 0.1, 99.9)).toBe(42);
  });

  it("rounds to 0.1 precision, preserving one decimal", () => {
    expect(roundForecast(65.5)).toBe(65.5);
    expect(roundForecast(65.54)).toBe(65.5);
    expect(roundForecast(65.56)).toBe(65.6);
  });
});

describe("BinarySlider keyboard entry", () => {
  it("renders the current value inside the thumb", () => {
    renderSlider();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("opens an input seeded with the current value on tap", () => {
    renderSlider();
    tapThumb(screen.getByText("50%"));

    const input = screen.getByLabelText(EDIT_LABEL) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("50");
  });

  it("opens on a touch tap via pointerup (iOS suppresses the first click)", () => {
    renderSlider();
    const value = screen.getByText("50%");
    fireEvent.pointerDown(value, {
      clientX: 10,
      clientY: 10,
      pointerType: "touch",
    });
    fireEvent.pointerUp(value, {
      clientX: 10,
      clientY: 10,
      pointerType: "touch",
    });

    expect(screen.getByLabelText(EDIT_LABEL)).toBeInTheDocument();
  });

  it("commits the typed value on Enter and reports it upward", () => {
    const { onChange } = renderSlider();
    tapThumb(screen.getByText("50%"));

    const input = screen.getByLabelText(EDIT_LABEL);
    fireEvent.change(input, { target: { value: "65.5" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(65.5);
    expect(screen.queryByLabelText(EDIT_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText("65.5%")).toBeInTheDocument();
  });

  it("commits on blur", () => {
    const { onChange } = renderSlider();
    tapThumb(screen.getByText("50%"));

    const input = screen.getByLabelText(EDIT_LABEL);
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("clamps out-of-range values on commit", () => {
    const { onChange } = renderSlider();
    tapThumb(screen.getByText("50%"));

    const input = screen.getByLabelText(EDIT_LABEL);
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(99.9);
  });

  it("reverts on Escape without reporting a change", () => {
    const { onChange } = renderSlider();
    tapThumb(screen.getByText("50%"));

    const input = screen.getByLabelText(EDIT_LABEL);
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(EDIT_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("does not open the editor when the press moves past the threshold (a drag)", () => {
    renderSlider();
    const value = screen.getByText("50%");
    fireEvent.pointerDown(value, {
      clientX: 0,
      clientY: 0,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(document, {
      clientX: 50,
      clientY: 0,
      pointerType: "mouse",
    });
    fireEvent.pointerUp(document, {
      clientX: 50,
      clientY: 0,
      pointerType: "mouse",
    });
    // Even if a browser emits a click after the drag, it must be ignored.
    fireEvent.click(value, { clientX: 50, clientY: 0 });

    expect(screen.queryByLabelText(EDIT_LABEL)).not.toBeInTheDocument();
  });
});
