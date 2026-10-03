import type {CommandContext,CommandResult} from "../../_shared/commands";import type {OnboardingCase} from "../types";
export type StartOnboardingCommand={customerId:string};
export type StartOnboardingHandler=(command:StartOnboardingCommand,context:CommandContext)=>Promise<CommandResult<OnboardingCase>>;
