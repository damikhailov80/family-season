import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Адаптер БД не подключён намеренно: Auth.js держит сессию в зашифрованной куке,
 * и на сервере не остаётся ни строчки о пользователе.
 *
 * Ключи Google читаются из `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` сами — Auth.js
 * ищет переменные по имени провайдера, поэтому в конфиге их нет.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    /*
     * Постоянный ключ аккаунта — имя строки в таблице настроек. Именно провайдер
     * плюс идентификатор, а не почта: почту меняют, и настройки потерялись бы.
     * `account` приходит только в тот заход, когда человек вошёл.
     */
    jwt({ token, account }) {
      if (account) token.accountKey = `${account.provider}:${account.providerAccountId}`
      return token
    },
    session({ session, token }) {
      /*
       * Ключа может не быть — у сессий, выпущенных до появления этого колбэка.
       * Подставлять вместо него `token.sub` **нельзя**, хотя соблазн есть:
       * без адаптера БД Auth.js кладёт туда случайный UUID, который живёт лишь
       * до конца сессии. Настройки по такому ключу нашлись бы сегодня и
       * потерялись при следующем входе. Пусть лучше ключа не будет вовсе —
       * кабинет это увидит и попросит войти заново.
       */
      session.accountKey = token.accountKey
      return session
    },
  },
})
