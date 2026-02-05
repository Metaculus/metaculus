import cn from "@/utils/core/cn";

import ContactForm, { ContactFormProps } from "./contact_form";
import ContactIntro from "./contact_intro";

type Props = {
  className?: string;
  id?: string;
  containerClassName?: string;
  formProps?: ContactFormProps;
} & Omit<ContactFormProps, "className" | "id">;

const ContactSection: React.FC<Props> = ({
  className,
  id,
  containerClassName,
  formProps,
  pageLabel,
  preselectedService,
  serviceOptions,
}) => {
  return (
    <section
      id={id}
      className={cn(
        "bg-gray-0 px-4 py-4 dark:bg-gray-0-dark sm:py-20",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto box-content flex w-full max-w-[1028px] flex-col gap-2 sm:gap-12 md:flex-row lg:gap-20",
          containerClassName
        )}
      >
        <ContactIntro />
        <ContactForm
          {...formProps}
          pageLabel={formProps?.pageLabel ?? pageLabel}
          preselectedService={
            formProps?.preselectedService ?? preselectedService
          }
          serviceOptions={formProps?.serviceOptions ?? serviceOptions}
        />
      </div>
    </section>
  );
};

export default ContactSection;
