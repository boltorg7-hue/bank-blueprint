import { createServerFn } from "@tanstack/react-start";

import { registerSchema } from "@/features/auth/schemas/auth.schemas";

export const registerCustomer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { createCustomerRegistration } = await import("./registration.server");
    return createCustomerRegistration(data);
  });
