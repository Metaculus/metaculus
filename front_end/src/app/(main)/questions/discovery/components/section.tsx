import { FC, PropsWithChildren } from "react";

type Props = {
  title: string;
};

const DiscoverySection: FC<PropsWithChildren<Props>> = ({
  title,
  children,
}) => (
  <section className="flex flex-col items-center gap-5 self-stretch bg-gray-0 p-6 dark:bg-gray-0-dark">
    <div className="flex flex-col items-start gap-2 self-stretch">
      <h2 className="m-0">{title}</h2>
    </div>
    {children}
  </section>
);

export default DiscoverySection;
