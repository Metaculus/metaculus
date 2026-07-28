import { act, render, screen } from "@testing-library/react";

import ViewportRender from "../viewport_render";

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];

  callback: IntersectionObserverCallback;
  disconnect = jest.fn();
  observe = jest.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

describe("ViewportRender", () => {
  beforeEach(() => {
    IntersectionObserverMock.instances = [];
    global.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  it("renders its children after entering the viewport", () => {
    render(
      <ViewportRender>
        <div>Heavy content</div>
      </ViewportRender>
    );

    expect(screen.queryByText("Heavy content")).not.toBeInTheDocument();

    const observer = IntersectionObserverMock.instances[0];
    expect(observer).toBeDefined();
    expect(observer?.observe).toHaveBeenCalledTimes(1);

    act(() => observer?.trigger(true));

    expect(screen.getByText("Heavy content")).toBeInTheDocument();
    expect(observer?.disconnect).toHaveBeenCalled();
  });
});
