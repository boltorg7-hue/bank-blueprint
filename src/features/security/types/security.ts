export type SecuritySessionDto = { id:string; deviceLabel:string; firstSeenAt:string; lastSeenAt:string; revokedAt:string|null; current:boolean };
export type SecurityEventDto = { id:string; type:string; title:string; detail:string; createdAt:string };
export type SecurityOverviewDto = { sessions:SecuritySessionDto[]; events:SecurityEventDto[] };
