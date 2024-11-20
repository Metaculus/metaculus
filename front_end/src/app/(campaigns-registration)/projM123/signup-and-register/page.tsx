import Header from "../components/header";
import { RegistrationAndSignUpPage } from "../components/registration-forms";
import { Heading1, Heading2 } from "../components/typography";

export default async function Page() {
  return (
    <>
      <Header />
      <main className="flex flex-grow justify-center">
        <div className="mt-16 flex size-full flex-col items-center">
          <Heading1>ProjectM123</Heading1>
          <Heading2>Register for project M123</Heading2>
          <div className="mt-6">
            <RegistrationAndSignUpPage campaignKey="projM123" />
          </div>
        </div>
      </main>
    </>
  );
}
