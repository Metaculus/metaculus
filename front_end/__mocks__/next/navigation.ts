const nextRouterMock = jest.requireActual(
  "next-router-mock"
) as typeof import("next-router-mock");

const { useRouter: useRouterMock } = nextRouterMock;

const usePathname = jest.fn().mockImplementation(() => {
  const router = useRouterMock();
  return router.pathname;
});

const useSearchParams = jest.fn().mockImplementation(() => {
  const router = useRouterMock();
  return new URLSearchParams(router.query as Record<string, string>);
});

const useRouter = jest.fn().mockImplementation(useRouterMock);

export { useRouter, usePathname, useSearchParams };
