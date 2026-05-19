"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkipLink } from "@/components/a11y/skip-link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenziali non valide");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <>
      <SkipLink href="#login-form">Vai al modulo di accesso</SkipLink>
      <main
        id="contenuto-principale"
        className="flex min-h-screen items-center justify-center bg-[var(--gray-50)] p-4"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h1">Accesso amministratore</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="login-form" onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={error ? true : undefined}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={error ? true : undefined}
                />
              </div>
              {error ? (
                <p id="login-error" role="alert" className="text-sm font-medium text-red-800">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                {loading ? "Accesso in corso…" : "Accedi"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
