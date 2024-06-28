"use client";

import Link from "next/link";
import { FC } from "react";

import Hr from "@/components/ui/hr";
import { UserProfile } from "@/types/users";

export type Props = {
  token: string;
};

const ApiAccess: FC<Props> = ({ token }) => {
  return (
    <div>
      <Hr className="m-0" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Access</h2>
      </div>
      <div className="text-sm">
        <p>
          You may use an API token to access the Metaculus API, per our{" "}
          <Link href="/api">documentation.</Link>
        </p>
        <span>Your API token is:</span>
        <pre>{token}</pre>
      </div>
    </div>
  );
};

export default ApiAccess;
