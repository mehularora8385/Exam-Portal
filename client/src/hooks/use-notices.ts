import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertNotice } from "@shared/routes";

export function useNotices() {
  return useQuery({
    queryKey: [api.notices.list.path],
    queryFn: async () => {
      const res = await fetch(api.notices.list.path);
      if (!res.ok) throw new Error("Failed to fetch notices");
      return api.notices.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertNotice) => {
      const validated = api.notices.create.input.parse(data);
      const res = await fetch(api.notices.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create notice");
      return api.notices.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notices.list.path] });
    },
  });
}
