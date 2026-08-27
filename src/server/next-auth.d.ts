import 'next-auth'
import 'next-auth/jwt'

/**
 * Расширение типов Auth.js под наш `accountKey` (см. `auth.ts`). Отдельным
 * файлом, потому что дополнение модуля нельзя объявить внутри самого `auth.ts`:
 * TypeScript сначала должен увидеть исходные интерфейсы.
 */
declare module 'next-auth' {
  interface Session {
    /** `провайдер:идентификатор` — имя строки настроек в базе. */
    accountKey?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountKey?: string
  }
}
