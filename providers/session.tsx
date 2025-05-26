import { useStorageState } from "@/hooks/useStorageState";
import { createContext, use, type PropsWithChildren } from "react";
import * as Crypto from "expo-crypto";
import { type SQLiteDatabase } from "expo-sqlite";

// Auth context === SESSSION PROVIDER ====

const AuthContext = createContext<{
  signIn: (
    db: SQLiteDatabase,
    emailOrUsername: string,
    password: string
  ) => Promise<void>;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");

  const hashPassword = async (password: string, salt: string) => {
    // Combine password and salt, then hash using SHA-256
    const saltedPassword = password + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      saltedPassword
    );
    return hash;
  };

  const signIn = async (
    db: SQLiteDatabase,
    emailOrUsername: string,
    password: string
  ) => {
    if (!emailOrUsername) {
      throw new Error("Email or username is required");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    try {
      // Query for user by email or username
      const user = await db.getFirstAsync<{
        id: number;
        username: string;
        email: string;
        password_hash: string;
        salt: string;
      }>("SELECT * FROM users WHERE email = ? OR username = ?", [
        emailOrUsername,
        emailOrUsername,
      ]);

      if (!user) {
        throw new Error("No account found with that email or username");
      }

      // Verify password
      const computedHash = await hashPassword(password, user.salt);
      if (computedHash !== user.password_hash) {
        throw new Error("Incorrect password");
      }

      // Store user ID, username, and email as session
      setSession(`${user.id}, ${user.username}, ${user.email}`);
      console.log("Signed in user:", { id: user.id, username: user.username });
    } catch (error: any) {
      console.error("Sign-in error:", {
        message: error.message,
        stack: error.stack,
        sql: "SELECT * FROM users WHERE email = ? OR username = ?",
        params: [emailOrUsername, "****"], // Mask password
      });
      throw error;
    }
  };

  const signOut = () => {
    setSession(null);
  };

  return (
    <AuthContext
      value={{
        signIn,
        signOut,
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
