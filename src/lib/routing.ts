import type { LinkProps } from "@tanstack/react-router";

/** Any valid in-app route path, checked against the generated route tree. */
export type AppPath = NonNullable<LinkProps["to"]>;
