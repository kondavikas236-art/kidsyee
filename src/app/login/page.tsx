"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, Mail, UserPlus, LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { KidsyeeLogo, KidsyeeTextLogo } from "@/components/Logo";

export default function LoginPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/parent/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (isSignUp) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-background">
      <Card className="w-full max-w-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-1 text-center bg-primary/5 p-8">
          <div className="bg-white p-4 rounded-3xl inline-block shadow-sm mb-2 text-primary">
            <KidsyeeLogo className="h-10 w-10" />
          </div>
          <CardTitle className="flex flex-col items-center">
            <KidsyeeTextLogo className="text-3xl" />
            <span className="text-lg font-bold mt-1">{isSignUp ? "Join Us" : "Parent Portal"}</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground font-semibold">
            {isSignUp ? "Create an account to protect your kids" : "Secure access to your family dashboard"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-8">
            <div className="space-y-2">
              <Label htmlFor="email">Parent Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Secret Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-8 pt-0">
            <Button type="submit" className="w-full rounded-full h-12 font-bold text-lg">
              {isSignUp ? <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</> : <><LogIn className="mr-2 h-5 w-5" /> Sign In</>}
            </Button>
            <Button
              variant="ghost"
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need a new account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
