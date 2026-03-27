import { useEffect, useState } from "react";

export interface UserProfile {
  firstName: string;
  fullName: string;
  phone: string;
  state: string;
  skill: string;
  experience: number;
  minJob: string;
  avgJob: string;
  premiumJob: string;
  bio: string;
  bvn: string;
  nin: string;
  bvnVerified: boolean;
  bvnName: string;
  paymentLink: string;
  slug: string;
  createdAt: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("craftid_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error reading saved user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}