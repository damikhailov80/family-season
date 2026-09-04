import { readFamily } from '../../../server/settings'

export async function GET() {
  return Response.json({ family: await readFamily() })
}
