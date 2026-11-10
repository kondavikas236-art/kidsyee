"use client";

import { useDoc, useMemoFirebase, useUser, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, Timer, Eye, Trophy, ShieldAlert, Trash2, Save, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from "recharts";

const INDIVIDUAL_DATA = [
  { name: 'Mon', mins: 120 },
  { name: 'Tue', mins: 85 },
  { name: 'Wed', mins: 140 },
  { name: 'Thu', mins: 60 },
  { name: 'Fri', mins: 90 },
  { name: 'Sat', mins: 180 },
  { name: 'Sun', mins: 150 },
];

export default function ChildReportPage() {
  const { childId } = useParams();
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const router = useRouter();
  
  const childRef = useMemoFirebase(() => {
    if (!db || !user || !childId) return null;
    return doc(db, "parentProfiles", user.uid, "childProfiles", childId as string);
  }, [db, user, childId]);

  const { data: child, isLoading } = useDoc(childRef);
  const [limits, setLimits] = useState({ daily: 120, gaming: 60 });

  useEffect(() => {
    if (child) {
      setLimits({
        daily: child.dailyScreenTimeLimitMinutes || 120,
        gaming: child.gamingTimeLimitMinutes || 60
      });
    }
  }, [child]);

  const handleUpdateLimits = () => {
    if (!childRef) return;
    updateDocumentNonBlocking(childRef, {
      dailyScreenTimeLimitMinutes: limits.daily,
      gamingTimeLimitMinutes: limits.gaming
    });
    toast({ title: "Limits Updated!", description: `New boundaries set for ${child?.name}.` });
  };

  const handleDeleteProfile = () => {
    if (!childRef) return;
    if (confirm(`Are you sure you want to delete ${child?.name}'s profile? All data will be lost.`)) {
      deleteDocumentNonBlocking(childRef);
      router.push("/parent/dashboard");
      toast({ title: "Profile Deleted", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Child Profile Not Found</h2>
        <Button onClick={() => router.push("/parent/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/parent/dashboard")} className="rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-4">
           <img src={child.avatarUrl} alt={child.name} className="h-14 w-14 rounded-2xl object-cover shadow-lg" />
           <div>
             <h1 className="text-3xl font-black text-foreground">{child.name}'s Eye Health Report</h1>
             <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Individual Wellness Tracking</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-bold text-primary">
              <Clock className="h-4 w-4" /> Usage Today
            </CardDescription>
            <CardTitle className="text-3xl font-black">1h 45m</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold text-green-600">On track for daily goal</div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-bold text-accent-foreground">
              <Eye className="h-4 w-4" /> Eye Health Score
            </CardDescription>
            <CardTitle className="text-3xl font-black">92%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold text-muted-foreground">4 Gym missions completed</div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-bold text-purple-500">
              <Trophy className="h-4 w-4" /> Gym Badges
            </CardDescription>
            <CardTitle className="text-3xl font-black">8</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold text-purple-600">Sight Sentinel Level 2</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[3rem] overflow-hidden">
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Daily screen time over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INDIVIDUAL_DATA}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <Bar dataKey="mins" radius={[10, 10, 0, 0]}>
                        {INDIVIDUAL_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.mins > limits.daily ? '#EF4444' : '#1996C5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem]">
            <CardHeader>
              <CardTitle>Recent Gym Achievements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { icon: Eye, label: "Blink Master", color: "bg-blue-500" },
                 { icon: Trophy, label: "Level 10", color: "bg-yellow-500" },
                 { icon: Timer, label: "Break King", color: "bg-green-500" },
                 { icon: Star, label: "Horizon Hero", color: "bg-purple-500" }
               ].map((badge, i) => (
                 <div key={i} className="flex flex-col items-center text-center gap-2 p-4 bg-muted/20 rounded-3xl">
                   <div className={`${badge.color} p-3 rounded-2xl text-white shadow-md`}>
                     <badge.icon className="h-6 w-6" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest">{badge.label}</span>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[3rem] sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" /> Eye Health Limits
              </CardTitle>
              <CardDescription>Set specific limits for {child.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">Daily Screen Limit</Label>
                  <Badge className="bg-primary/10 text-primary">{Math.floor(limits.daily / 60)}h {limits.daily % 60}m</Badge>
                </div>
                <Slider 
                  value={[limits.daily]} 
                  onValueChange={([val]) => setLimits({...limits, daily: val})} 
                  max={360} 
                  min={30} 
                  step={15} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">Max Session Time</Label>
                  <Badge className="bg-accent/20 text-accent-foreground">{limits.gaming} Minutes</Badge>
                </div>
                <Slider 
                  value={[limits.gaming]} 
                  onValueChange={([val]) => setLimits({...limits, gaming: val})} 
                  max={120} 
                  min={0} 
                  step={10} 
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button onClick={handleUpdateLimits} className="w-full rounded-full h-12 font-bold shadow-md">
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                <Button variant="ghost" onClick={handleDeleteProfile} className="w-full rounded-full h-12 font-bold text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
