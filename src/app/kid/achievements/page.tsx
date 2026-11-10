"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, ShieldCheck, Zap, Heart, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const badges = [
    {
      id: 1,
      name: "Blink Master",
      description: "Completed 10 Eye Gym missions",
      icon: Eye,
      color: "bg-blue-500",
      earned: true,
      progress: 100,
    },
    {
      id: 2,
      name: "Horizon Hero",
      description: "Used the 20-20-20 rule all week",
      icon: ShieldCheck,
      color: "bg-green-500",
      earned: true,
      progress: 100,
    },
    {
      id: 3,
      name: "Focus Champion",
      description: "Kept energy bar green for 2 hours",
      icon: Zap,
      color: "bg-yellow-500",
      earned: false,
      progress: 60,
    },
    {
      id: 4,
      name: "Play Guardian",
      description: "Took 5 breaks before being asked",
      icon: Star,
      color: "bg-purple-500",
      earned: false,
      progress: 25,
    },
    {
      id: 5,
      name: "Sight Sentinel",
      description: "Completed 30 Eye Gym sessions",
      icon: Heart,
      color: "bg-red-500",
      earned: false,
      progress: 80,
    },
  ];

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-4">
        <div className="inline-block p-4 rounded-full bg-accent/20 border-2 border-accent/40 shadow-lg animate-float">
          <Trophy className="h-16 w-16 text-accent-foreground" />
        </div>
        <h1 className="text-4xl font-black text-primary">Eye Gym Hall of Fame</h1>
        <p className="text-muted-foreground font-semibold">You have earned {earnedCount} badges for protecting your sight!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <Card key={badge.id} className={cn(
              "rounded-[2.5rem] border-2 transition-all hover:scale-105 relative overflow-hidden",
              badge.earned ? "border-accent/40 glass" : "border-muted bg-muted/5 opacity-70"
            )}>
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "p-6 rounded-[2rem] text-white shadow-xl mb-2",
                  badge.earned ? badge.color : "bg-muted-foreground/30"
                )}>
                  <Icon className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{badge.description}</p>
                </div>
                
                <div className="w-full space-y-2 pt-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Progress</span>
                    <span>{badge.progress}%</span>
                  </div>
                  <Progress value={badge.progress} className="h-2" />
                </div>

                {!badge.earned && (
                  <Badge variant="outline" className="mt-2 rounded-full border-muted-foreground/20 text-muted-foreground">
                    Locked
                  </Badge>
                )}
                {badge.earned && (
                  <Badge className="mt-2 rounded-full bg-accent text-accent-foreground font-bold animate-pulse">
                    Earned!
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
