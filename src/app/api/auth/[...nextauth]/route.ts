import { handlers } from '../../../../server/auth'

/** Все адреса входа (`/api/auth/*`) обслуживает сам Auth.js. */
export const { GET, POST } = handlers
