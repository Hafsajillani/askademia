import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../supabaseClient";
import { Session, AuthError } from "@supabase/supabase-js";

// Define the shape of the AuthContext
interface AuthContextType {
  signUpNewUser: (email: string, password: string) => Promise<{
    success: boolean;
    data?: { user: any; session: any };
    error?: AuthError;
  }>;
  signInUser: (email: string, password: string) => Promise<{
    success: boolean;
    data?: { user: any; session: any };
    error?: string;
  }>;
  session: Session | null | undefined;
  signOut: () => Promise<void>;
}

// Create the AuthContext with TypeScript typing
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props type for AuthContextProvider
interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // Sign up
  const signUpNewUser = async (email: string, password: string): Promise<{
    success: boolean;
    data?: { user: any; session: any };
    error?: AuthError;
  }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
    });

    if (error) {
      console.error("Error signing up: ", error);
      return { success: false, error };
    }

    return { success: true, data };
  };

  // Sign in
  const signInUser = async (email: string, password: string): Promise<{
    success: boolean;
    data?: { user: any; session: any };
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      // Handle Supabase error explicitly
      if (error) {
        console.error("Sign-in error:", error.message);
        return { success: false, error: error.message };
      }

      // If no error, return success
      console.log("Sign-in success:", data);
      return { success: true, data };
    } catch (err: any) {
      // Handle unexpected issues
      console.error("Unexpected error during sign-in:", err.message);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Sign out
  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ signUpNewUser, signInUser, session, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};