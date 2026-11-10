"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ShieldCheck, Mail, Loader2, User, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { KidsyeeLogo } from "@/components/Logo";

export default function ParentSettings() {
  const { user } = useUser();
  const db = useFirestore();

  const parentRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "parentProfiles", user.uid);
  }, [db, user]);

  const { data: parentProfile, isLoading } = useDoc(parentRef);

  const [settings, setSettings] = useState({
    firstName: "",
    lastName: "",
    enableCockroachDeterrent: true,
    receiveWeeklyReportEmail: false,
  });

  useEffect(() => {
    if (parentProfile) {
      setSettings((prev) => ({
        ...prev,
        firstName: parentProfile.firstName || "",
        lastName: parentProfile.lastName || "",
        receiveWeeklyReportEmail: parentProfile.receiveWeeklyReportEmail || false,
        enableCockroachDeterrent: parentProfile.enableCockroachDeterrent !== false,
      }));
    }
  }, [parentProfile]);

  const handleSave = () => {
    if (!parentRef || !user) return;

    setDocumentNonBlocking(parentRef, {
      id: user.uid,
      firstName: settings.firstName,
      lastName: settings.lastName,
      receiveWeeklyReportEmail: settings.receiveWeeklyReportEmail,
      enableCockroachDeterrent: settings.enableCockroachDeterrent,
      email: user.email || "",
      isPro: parentProfile?.isPro || false,
    }, { merge: true });

    toast({
      title: "Settings Saved!",
      description: "Control Center preferences updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Control Center</h2>
        </div>
        <Button onClick={handleSave} className="rounded-full px-8 font-bold shadow-lg">Save Changes</Button>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Parent Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={settings.firstName} onChange={(e) => setSettings({...settings, firstName: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={settings.lastName} onChange={(e) => setSettings({...settings, lastName: e.target.value})} className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-l-4 border-l-primary">
          <CardHeader>
             <div className="flex items-center gap-2 mb-2">
              <KidsyeeLogo className="h-6 w-6 text-primary" />
              <CardTitle>Cockroach Mode</CardTitle>
            </div>
            <CardDescription>Realistic insects scurry across the screen when time limits are exceeded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Enable Cockroach Mode</Label>
                <p className="text-sm text-muted-foreground">Automatic insect deterrent when limits are hit.</p>
              </div>
              <Switch checked={settings.enableCockroachDeterrent} onCheckedChange={(val) => setSettings({...settings, enableCockroachDeterrent: val})} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>AI Family Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Weekly Eye Wellness Email</Label>
                <p className="text-sm text-muted-foreground">Receive a consolidated summary of all children's eye health activity.</p>
              </div>
              <Switch checked={settings.receiveWeeklyReportEmail} onCheckedChange={(val) => setSettings({...settings, receiveWeeklyReportEmail: val})} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
