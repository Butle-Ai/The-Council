// Protects your API credits once the site is public.
// If the ACCESS_CODE environment variable is set (on Vercel), only people who
// type that code can run a council. Everyone else can still click
// "See an example", which costs nothing. With no ACCESS_CODE (like on your own
// computer), anyone can run it.

export function accessCodeRequired(): boolean {
  return Boolean(process.env.ACCESS_CODE);
}

export function checkAccess(request: Request): Response | null {
  const code = process.env.ACCESS_CODE;
  if (!code) return null;
  if (request.headers.get("x-access-code")?.trim() === code) return null;
  return Response.json({ error: "Wrong or missing access code." }, { status: 401 });
}
