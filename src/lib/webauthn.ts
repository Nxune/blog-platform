export const RP_NAME = "Nexus Community";

export function getRPID(request: Request): string {
  return new URL(request.url).hostname;
}

export function getOrigin(request: Request): string {
  return new URL(request.url).origin;
}
