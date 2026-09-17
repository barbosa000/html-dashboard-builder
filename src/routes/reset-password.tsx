import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — OS PIA do Gelo" },
      { name: "description", content: "Defina uma nova senha para acessar o painel." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // O link do e-mail de recuperação abre esta página já autenticada numa
    // sessão temporária de "recovery" — o supabase-js detecta o token pela
    // própria URL. Só precisamos confirmar que existe uma sessão antes de
    // deixar o usuário definir a nova senha.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada. Você já está logado.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel w-full max-w-sm p-7">
        <div className="mb-6">
          <h1 className="font-display text-lg font-semibold">Definir nova senha</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {ready
              ? "Escolha uma nova senha para sua conta."
              : "Abra esta página pelo link enviado no e-mail de redefinição."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={password}
              required
              minLength={6}
              disabled={!ready}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              value={confirm}
              required
              minLength={6}
              disabled={!ready}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!ready || loading}>
            Salvar nova senha
          </Button>
        </form>

        <a
          href="/auth"
          className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Voltar para o login
        </a>
      </div>
    </div>
  );
}
