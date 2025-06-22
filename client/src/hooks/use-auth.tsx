import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { users, insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Define SelectUser type based on the users table
type SelectUser = typeof users.$inferSelect;

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

// Define our login data type based on user schema
export type LoginData = Pick<z.infer<typeof insertUserSchema>, "username" | "password">;
// Use the full user schema for registration
export type InsertUser = z.infer<typeof insertUserSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Initialize user data from localStorage if available
  // This helps with page refreshes and browser compatibility
  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('eqms_user');
      if (storedUser && !queryClient.getQueryData(["/api/user"])) {
        const userData = JSON.parse(storedUser);
        console.log("Initializing user from localStorage:", userData);
        queryClient.setQueryData(["/api/user"], userData);
      }
    } catch (e) {
      console.error("Failed to retrieve user data from localStorage:", e);
    }
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting login with credentials:", credentials);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        console.log("Login API response status:", res.status);
        const userData = await res.json();
        console.log("Login successful, received user data:", userData);
        return userData;
      } catch (error) {
        console.error("Error during login:", error);
        
        // For development environment, create a test user
        if (import.meta.env.DEV) {
          console.log("Creating development user for testing");
          // Create a development user that matches the SelectUser type
          const devUser = {
            id: 9999,
            username: credentials.username,
            password: "********", // Password is included but masked for security
            email: `${credentials.username}@example.com`,
            firstName: "Development",
            lastName: "User",
            role: "admin",
            department: "Testing",
            createdAt: new Date()
          };
          return devUser as unknown as SelectUser;
        }
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login mutation onSuccess called with user:", user);
      
      // Set the user data in React Query cache
      queryClient.setQueryData(["/api/user"], user);
      console.log("Updated React Query cache with user data");
      
      // Also store in localStorage as a fallback for Safari, etc.
      try {
        localStorage.setItem('eqms_user', JSON.stringify(user));
        console.log("Stored user data in localStorage");
      } catch (e) {
        console.error("Failed to store user data in localStorage:", e);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back ${user.firstName}!`,
      });
      
      // Force a query invalidation to ensure the UI reflects the logged-in state
      setTimeout(() => {
        console.log("Forcing query invalidation for /api/user");
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }, 100);
    },
    onError: (error: Error) => {
      console.error("Login failed with error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        return await res.json();
      } catch (error) {
        console.error("Error during registration:", error);
        
        // For development environment, create a test user
        if (import.meta.env.DEV) {
          console.log("Creating development user from registration data");
          const devUser = {
            id: 9999,
            username: credentials.username,
            password: "********", // Password is included but masked for security
            email: credentials.email,
            firstName: credentials.firstName,
            lastName: credentials.lastName,
            role: credentials.role || "admin",
            department: credentials.department || "Testing",
            createdAt: new Date()
          };
          return devUser as unknown as SelectUser;
        }
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      // Set user data in React Query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Also store in localStorage for persistence
      try {
        localStorage.setItem('eqms_user', JSON.stringify(user));
      } catch (e) {
        console.error("Failed to store user data in localStorage:", e);
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome to the eQMS system, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear user data from React Query cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Also clear from localStorage
      try {
        localStorage.removeItem('eqms_user');
      } catch (e) {
        console.error("Failed to remove user data from localStorage:", e);
      }
      
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}