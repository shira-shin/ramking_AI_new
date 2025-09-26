import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

if (!process.env.NEXTAUTH_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("NEXTAUTH_SECRET is not set. Authentication may not work as expected.");
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  // eslint-disable-next-line no-console
  console.warn("Google OAuth environment variables are not fully configured.");
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: clientId ?? "",
      clientSecret: clientSecret ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
});
