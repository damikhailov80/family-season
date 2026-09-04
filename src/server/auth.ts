import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    jwt({ token, account }) {
      if (account) token.accountKey = `${account.provider}:${account.providerAccountId}`
      return token
    },
    session({ session, token }) {
      session.accountKey = token.accountKey
      return session
    },
  },
})
