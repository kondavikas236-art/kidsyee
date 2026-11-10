"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Clock, Smartphone, AlertCircle, TrendingUp, CheckCircle2, UserPlus, Shield, Loader2, ChevronRight, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const USAGE_DATA = [
  { day: 'Mon', video: 45, education: 120, social: 15 },
  { day: 'Tue', video: 60, education: 90, social: 20 },
  { day: 'Wed', video: 30, education: 150, social: 10 },
  { day: 'Thu', video: 90, education: 60, social: 30 },
  { day: 'Fri', video: 120, education: 45, social: 40 },
  { day: 'Sat', video: 180, education: 30, social: 60 },
  { day: 'Sun', video: 150, education: 30, social: 45 },
];

const chartConfig: ChartConfig = {
  video: { label: "YouTube/Video", color: "#FF0000" },
  education: { label: "Educational", color: "#CFE467" },
  social: { label: "Social Media", color: "#4FB0C6" },
};

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ParentDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [newChildName, setNewChildName] = useState("");
  const [newChildDob, setNewChildDob] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const parentRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "parentProfiles", user.uid);
  }, [db, user]);

  const { data: parentProfile } = useDoc(parentRef);

  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: children, isLoading } = useCollection(childrenQuery);

  const handleAddChild = () => {
    if (!db || !user || !newChildName.trim() || !newChildDob) return;
    
    if (!parentProfile?.isPro && children && children.length >= 1) {
      toast({
        variant: "destructive",
        title: "Child Limit Reached",
        description: "Upgrade to Family Pro to add unlimited child profiles!",
      });
      return;
    }

    const colRef = collection(db, "parentProfiles", user.uid, "childProfiles");
    addDocumentNonBlocking(colRef, {
      parentId: user.uid,
      name: newChildName,
      dateOfBirth: newChildDob,
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
      dailyScreenTimeLimitMinutes: 120,
      gamingTimeLimitMinutes: 60
    });

    setNewChildName("");
    setNewChildDob("");
    setIsAddOpen(false);
  };

  const displayName = parentProfile?.firstName || "Guardian";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {displayName}!
          </h2>
          <p className="text-muted-foreground font-medium">Monitoring wellness for {children?.length || 0} children</p>
        </div>
        <div className="flex gap-3">
          {!parentProfile?.isPro && (
            <Link href="/parent/billing">
              <Button variant="outline" className="rounded-full h-12 px-6 font-bold border-primary text-primary bg-primary/5 hover:bg-primary/10">
                <Sparkles className="mr-2 h-5 w-5" /> Go Pro
              </Button>
            </Link>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-12 px-6 font-bold">
                <UserPlus className="mr-2 h-5 w-5" /> Add Child
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle>New Child Profile</DialogTitle>
                <DialogDescription>Add a profile to track screen time and healthy habits.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Child Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Alex" 
                    value={newChildName} 
                    onChange={(e) => setNewChildName(e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob" 
                    type="date"
                    value={newChildDob} 
                    onChange={(e) => setNewChildDob(e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddChild} className="rounded-full w-full h-12 font-bold">Save Profile</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!parentProfile?.isPro && (
        <Card className="rounded-[2.5rem] bg-gradient-to-r from-primary to-blue-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Zap className="h-32 w-32" />
          </div>
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic">Unlock Unlimited Potential</h3>
              <p className="font-bold opacity-90 max-w-lg">Get unlimited child profiles, advanced eye wellness analytics, and custom Cockroach Mode settings with Family Pro.</p>
            </div>
            <Link href="/parent/billing">
              <Button className="bg-white text-primary hover:bg-white/90 rounded-full h-12 px-8 font-black text-lg">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : children?.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-primary/20 p-12 text-center bg-primary/5">
          <Shield className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No Children Yet</h3>
          <p className="text-muted-foreground mb-6">Add your first child profile to start monitoring screen time.</p>
          <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-full">Add Children Now</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Daily Avg
              </CardDescription>
              <CardTitle className="text-2xl font-black">2h 45m</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 12% decrease
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" /> Goal Progress
              </CardDescription>
              <CardTitle className="text-2xl font-black">85%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold text-muted-foreground">Limits met 6/7 days</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" /> System Active
              </CardDescription>
              <CardTitle className="text-2xl font-black">Healthy</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-xs font-bold text-blue-500 flex items-center gap-1">
                 <Shield className="h-3 w-3" /> Monitoring ON
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" /> Active Alerts
              </CardDescription>
              <CardTitle className="text-2xl font-black">{children && children.length > 0 ? "1 Active" : "0"}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-xs font-bold text-destructive">Daily limit reached</div>
            </CardContent>
          </Card>
        </div>
      )}

      {children && children.length > 0 && (
        <>
          <Card className="rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Global Usage Trends</CardTitle>
                <CardDescription>Breakdown of cross-app activity</CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full px-4 py-1 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live Monitoring
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={USAGE_DATA}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend iconType="circle" />
                        <Bar dataKey="education" stackId="a" fill="var(--color-education)" />
                        <Bar dataKey="video" stackId="a" fill="var(--color-video)" />
                        <Bar dataKey="social" stackId="a" fill="var(--color-social)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h3 className="text-2xl font-black text-foreground">Family Profiles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <Link key={child.id} href={`/parent/child/${child.id}`}>
                  <Card className="rounded-[2.5rem] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-6 w-6 text-primary" />
                    </div>
                    <CardContent className="p-6 flex items-center gap-4">
                      <img src={child.avatarUrl} alt={child.name} className="h-16 w-16 rounded-3xl object-cover shadow-md" />
                      <div>
                        <p className="text-lg font-black">{child.name}</p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Age {calculateAge(child.dateOfBirth)}</p>
                        <Badge variant="secondary" className="mt-2 bg-primary/5 text-primary text-[10px] font-bold">View Report</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}