// GET /api/config -> { needsCode } so the page knows whether to show the access code box.
import { accessCodeRequired } from "@/lib/access";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ needsCode: accessCodeRequired() });
}
