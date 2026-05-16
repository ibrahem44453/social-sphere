import { useAuth } from "@/contexts/AuthContext";

export function useApiHeaders(): Record<string, string> {
  const { user } = useAuth();
  const headers: Record<string, string> = {};
  if (user) headers["x-user-id"] = user.id;
  return headers;
}
