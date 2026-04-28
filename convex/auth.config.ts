import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://distinct-guppy-14.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
