import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Row = { id: string } & Record<string, any>;

async function fetchCollection(collection: string): Promise<Row[]> {
  const { data, error } = await supabase
    .from("records")
    .select("id, doc_key, data, created_at")
    .eq("collection", collection)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    _key: r.doc_key ?? undefined,
    ...(r.data as Record<string, any>),
  }));
}

export function useCollection(collection: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["records", collection],
    queryFn: () => fetchCollection(collection),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["records", collection] });

  const add = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { error } = await supabase.from("records").insert({ collection, data });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { error } = await supabase.from("records").update({ data }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    add: (data: Record<string, any>) => add.mutateAsync(data),
    update: (id: string, data: Record<string, any>) => update.mutateAsync({ id, data }),
    remove: (id: string) => remove.mutateAsync(id),
  };
}

/** Singleton documents: one row per (collection, key) — settings, monthly costs, checklist… */
export function useDoc<T extends Record<string, any>>(collection: string, key: string, fallback: T) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["doc", collection, key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("records")
        .select("id, data")
        .eq("collection", collection)
        .eq("doc_key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.data as T) ?? null;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<T>) => {
      const next = { ...fallback, ...(query.data ?? {}), ...patch };
      const { error } = await supabase
        .from("records")
        .upsert({ collection, doc_key: key, data: next }, { onConflict: "user_id,collection,doc_key" });
      if (error) throw error;
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc", collection, key] }),
  });

  return {
    data: { ...fallback, ...(query.data ?? {}) } as T,
    isLoading: query.isLoading,
    save: (patch: Partial<T>) => save.mutateAsync(patch),
  };
}
