
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FocusMeter } from "@/components/FocusMeter";
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from "recharts";
import { Eye, Star, Sparkles, Timer, AlertCircle, ShieldCheck, Shield, Trophy, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useScreenTime, formatMinutes } from "@/hooks/use-screen-time";
import { generateSmartBreakPrompt, type SmartBreakPromptOutput } from "@/ai/flows/ai-smart-break-prompt";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

const DATA = [
  { name: 'Video', mins: 45, color: '#FF0000' },
  { name: 'Study', mins: 120, color: '#CFE467' },
  { name: 'Gaming', mins: 30, color: '#1996C5' },
];

export default function KidDashboard() {
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const { minutes: usedMinutes } = useScreenTime();
  const [breakSuggestion, setBreakSuggestion] = useState<SmartBreakPromptOutput | null>(null);

  // Fetch children to get the child's name dynamically
  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: childrenData, isLoading: isChildrenLoading } = useCollection(childrenQuery);

  const explorerName = childrenData?.[0]?.name || "Explorer";
  const dailyLimit = childrenData?.[0]?.dailyScreenTimeLimitMinutes || 120;
  // Energy drains as the day's screen time approaches the parent's limit.
  const focusValue = Math.max(5, Math.round(100 - (usedMinutes / dailyLimit) * 100));
  const isLowFocus = focusValue < 30;
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (!isLowFocus || promptShownRef.current) return;
    const timer = setTimeout(async () => {
      promptShownRef.current = true;
      const output = await generateSmartBreakPrompt({
        childName: explorerName,
        screenTimeMinutes: usedMinutes,
        lastActivityCategory: "Educational",
        isEyeRestNeeded: true
      });
      setBreakSuggestion(output);
      
      toast({
        title: `Buddy Check-in for ${explorerName}! ✨`,
        description: output.suggestionText,
        duration: 10000,
      });
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLowFocus, explorerName]);

  if (isChildrenLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border border-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Protection</p>
            <p className="text-sm font-bold text-foreground">Safe Zone Active</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full border-green-200">
          Monitoring {explorerName}
        </Badge>
      </div>

      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-white to-primary/5 p-8 border-4 border-white shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={cn(
            "p-8 rounded-full bg-white shadow-inner relative transition-all duration-700",
            isLowFocus ? "ring-8 ring-destructive/20" : "ring-8 ring-accent/20"
          )}>
            <div className={cn(
              "relative z-10 transition-colors duration-700",
              isLowFocus ? "text-destructive animate-eye-strained" : "text-green-500 animate-eye-healthy"
            )}>
              <Eye className="h-24 w-24" />
            </div>
            
            <div className={cn(
              "absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-700",
              isLowFocus ? "bg-destructive animate-pulse" : "bg-green-500"
            )} />
          </div>

          <div className="space-y-2 max-w-lg">
            <h2 className={cn(
              "text-3xl font-black italic tracking-tight transition-colors duration-700",
              isLowFocus ? "text-destructive" : "text-primary"
            )}>
              {isLowFocus ? `${explorerName}, eyes need a break!` : `${explorerName}'s eyes are feeling great!`}
            </h2>
            <p className="text-muted-foreground font-semibold">
              {isLowFocus 
                ? "They've been looking at the screen for a long time. Let's rest them!" 
                : `Looking good, ${explorerName}! Remember to blink often and look far away.`}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            {explorerName}'s Eye Data <Sparkles className="text-accent-foreground h-6 w-6" />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="rounded-[2.5rem] border-primary/20 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="max-w-3xl mx-auto">
                <FocusMeter value={focusValue} label="Energy Level" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
                <div className="space-y-1">
                  <div className="bg-primary/10 p-4 rounded-3xl inline-block mb-1">
                    <Timer className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Screen Time</p>
                  <p className="text-2xl font-black">{formatMinutes(usedMinutes)}</p>
                  <p className="text-xs font-bold text-muted-foreground">of {formatMinutes(dailyLimit)} limit</p>
                </div>
                <div className="space-y-1">
                  <div className="bg-accent/10 p-4 rounded-3xl inline-block mb-1">
                    <Eye className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Eye Rests</p>
                  <p className="text-2xl font-black">4/5</p>
                </div>
                <div className="space-y-1">
                  <div className="bg-blue-100 p-4 rounded-3xl inline-block mb-1">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Missions</p>
                  <p className="text-2xl font-black">2 Done</p>
                </div>
              </div>

              {isLowFocus && (
                <div className="bg-destructive/10 border-2 border-destructive/20 p-6 rounded-[2rem] flex items-center gap-4 animate-in zoom-in duration-300">
                  <div className="p-3 bg-destructive rounded-2xl text-white">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-destructive text-lg">Recharge Needed, {explorerName}!</h3>
                    <p className="text-destructive/80 font-bold">Try the 'Eye Gym' or look at the horizon for 20 seconds.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Quick Quests</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/kid/eye-health">
              <Card className="rounded-3xl border-2 border-transparent hover:border-primary/40 transition-all kid-card-hover cursor-pointer group">
                <CardHeader className="flex flex-row items-center space-x-4">
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Eye Gym</CardTitle>
                    <p className="text-sm text-muted-foreground">Give your eyes a holiday</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <div className="bg-muted/30 p-6 rounded-[2rem] border-2 border-dashed flex items-center gap-4 opacity-60">
               <div className="p-3 bg-muted rounded-xl">
                 <Info className="h-5 w-5 text-muted-foreground" />
               </div>
               <p className="text-sm font-bold text-muted-foreground italic">Stay tuned for new quests, {explorerName}!</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Recent Trophies</h2>
            <Link href="/kid/achievements" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <Card className="rounded-3xl border-none shadow-lg bg-white p-6">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                 <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-md">
                   <Eye className="h-8 w-8" />
                 </div>
                 <span className="text-[10px] font-bold text-center">Blink<br/>Master</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                 <div className="p-4 bg-yellow-500 rounded-2xl text-white shadow-md">
                   <Trophy className="h-8 w-8" />
                 </div>
                 <span className="text-[10px] font-bold text-center">Focus<br/>Champ</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2 opacity-30">
                 <div className="p-4 bg-gray-200 rounded-2xl text-gray-500">
                   <Trophy className="h-8 w-8" />
                 </div>
                 <span className="text-[10px] font-bold text-center">Locked</span>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{explorerName}'s Eye Health Mix</h2>
        <Card className="rounded-3xl border-none shadow-lg bg-white/50">
          <CardContent className="p-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                  <Bar dataKey="mins" radius={[10, 10, 0, 0]}>
                    {DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
