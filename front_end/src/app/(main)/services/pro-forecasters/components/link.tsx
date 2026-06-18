import Link from "next/link";
import { FC, PropsWithChildren } from "react";

type Props = {
  href: string;
  internal?: boolean;
};

const ProForecasterLink: FC<PropsWithChildren<Props>> = ({
  href,
  internal = false,
  children,
}) => {
  const Container = internal ? Link : "a";

  return (
    <Container
      href={href}
      className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
      target={"_blank"}
    >
      {children}
    </Container>
  );
};

export default ProForecasterLink;
