import { readFamily } from '../../../server/settings'

/**
 * Состав для уже открытого постера: подменить в нём людей может только сам лист,
 * а он клиентский и до базы не дотягивается.
 *
 * Своей обработки ошибок нет намеренно: `readFamily` отдаёт `null` всякий раз,
 * когда подставлять нечего, и `null` означает «кнопки не будет».
 */
export async function GET() {
  return Response.json({ family: await readFamily() })
}
