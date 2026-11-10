"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Shield, Timer, Award, Compass, ChevronRight, CheckCircle2, Loader2, Search } from "lucide-react";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { textToSpeech } from "@/ai/flows/tts-flow";

const MISSIONS = [
  { 
    id: "blink", 
    title: "Blink Buddy", 
    description: "A full routine to refresh and stretch your eyes!", 
    duration: 60,
    color: "bg-primary/10",
    icon: Eye,
    steps: [
      "Ready...", 
      "Blink fast like a butterfly!", 
      "Now, blink slowly...", 
      "Squeeze your eyes shut tight!", 
      "Open them wide!", 
      "Look left... and now right!",
      "Look up... and now down!",
      "Roll your eyes in a big circle!",
      "Almost there!", 
      "Eyes refreshed!"
    ]
  },
  { 
    id: "distance", 
    title: "Distance Detective", 
    description: "Find 3 different things far away in your room.", 
    duration: 45, 
    color: "bg-accent/10",
    icon: Search,
    steps: [
      "Ready...", 
      "Find something BLUE far away...", 
      "Now find something ROUND far away...", 
      "Finally, find something TALL far away...", 
      "Great job, Detective!"
    ]
  }
];

function VisualEyeGym({ stepText }: { stepText: string }) {
  const text = stepText.toLowerCase();
  
  // Instruction parsing
  const isBlinkFast = text.includes("blink fast");
  const isBlinkSlow = text.includes("blink slowly");
  const isShutTight = text.includes("shut tight");
  const isWide = text.includes("wide");
  const isLeftRight = text.includes("left") || text.includes("right");
  const isUpDown = text.includes("up") || text.includes("down");
  const isRoll = text.includes("roll");
  const isDetective = text.includes("far away");
  const isFinished = text.includes("refreshed") || text.includes("great job");

  return (
    <div className="flex gap-8 sm:gap-16 justify-center items-center py-8 sm:py-16">
      {[0, 1].map((i) => (
        <div key={i} className={cn(
          "relative w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full border-[8px] sm:border-[12px] border-primary shadow-inner flex items-center justify-center overflow-hidden transition-all duration-300",
          isDetective && "ring-8 ring-offset-4 ring-accent/30",
          isFinished && "animate-eye-healthy"
        )}>
          {/* Lids */}
          <div className={cn(
            "absolute inset-0 bg-primary/40 z-20 origin-top transition-transform duration-300",
            isShutTight ? "scale-y-100" : "scale-y-0",
            isBlinkFast && "animate-eye-blink-fast",
            isBlinkSlow && "animate-eye-blink-slow"
          )} />
          
          {/* Pupil/Iris Container - Provides a safe movement area */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 bg-foreground rounded-full transition-all duration-700 relative",
              isWide && "scale-125",
              isLeftRight && "animate-eye-left-right",
              isUpDown && "animate-eye-up-down",
              isRoll && "animate-eye-roll",
              isDetective && "animate-eye-focus"
            )}>
              {/* Highlight for a wet/shiny eye look */}
              <div className="w-3 h-3 sm:w-5 sm:h-5 bg-white rounded-full absolute top-2 left-2 opacity-60" />
            </div>
          </div>

          {/* Eye socket shadow for depth */}
          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

export default function EyeHealthPage() {
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: childrenData, isLoading: isChildrenLoading } = useCollection(childrenQuery);

  const explorerName = childrenData?.[0]?.name || "Explorer";
  const activeMission = MISSIONS.find(m => m.id === activeMissionId);

  const playInstruction = async (text: string) => {
    if (!text) return;
    setIsAudioLoading(true);
    try {
      const result = await textToSpeech(text);
      if (result.media) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = result.media;
        audioRef.current.play().catch(e => {
          if (e.name !== 'AbortError') {
             console.warn("Audio playback interrupted:", e);
          }
        });
      }
    } catch (err) {
      console.error("TTS instruction failed:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Sync instruction with current step change
  useEffect(() => {
    if (activeMission && !isDone) {
      playInstruction(activeMission.steps[currentStep]);
    }
  }, [currentStep, activeMissionId, isDone]);

  useEffect(() => {
    if (isDone) {
      playInstruction(`Mission Complete, ${explorerName}! Your eyes feel supercharged!`);
    }
  }, [isDone, explorerName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMissionId && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && activeMissionId) {
      if (activeMission && currentStep < activeMission.steps.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setTimer(7); // Give 7 seconds per active step for instruction + animation
      } else {
        setIsDone(true);
        setActiveMissionId(null);
        window.dispatchEvent(new CustomEvent('mindful-play:break-completed'));
      }
    }
    return () => clearInterval(interval);
  }, [activeMissionId, timer, currentStep, activeMission]);

  const startMission = (missionId: string) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission) return;
    
    setIsDone(false);
    setActiveMissionId(missionId);
    setCurrentStep(0);
    setTimer(5); // Initial delay
  };

  const bgImage = PlaceHolderImages.find(img => img.id === 'eye-health-bg');

  if (isChildrenLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-primary italic underline decoration-primary decoration-4 tracking-tight">Eye Gym</h1>
        <p className="text-muted-foreground font-semibold text-sm">Super-powered workout for your eyes, {explorerName}!</p>
      </div>

      {activeMissionId && activeMission ? (
        <Card className="rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300">
          <CardContent className="p-0">
            <div className="min-h-[300px] sm:min-h-[420px] bg-muted relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-muted to-white">
              <img src={bgImage?.imageUrl} alt="Mission BG" className="absolute inset-0 w-full h-full object-cover opacity-10" />
              <div className="relative z-10 w-full px-4 sm:px-8 flex flex-col items-center">
                 <VisualEyeGym stepText={activeMission.steps[currentStep]} />
                 <div className="flex flex-col items-center mt-4">
                    <div className="text-4xl sm:text-6xl font-black text-primary drop-shadow-md bg-white/90 px-8 py-2 rounded-full border-4 border-primary/20">
                      {timer}s
                    </div>
                    <div className="mt-4 text-[10px] sm:text-xs font-black text-primary/70 uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                      {isAudioLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      Step {currentStep + 1} of {activeMission.steps.length}
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="p-8 sm:p-12 text-center space-y-8 glass-strong">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-primary">{activeMission.title}</h2>
                <div className="bg-primary/5 p-8 rounded-[2rem] border-4 border-primary/10 shadow-inner">
                  <p className="text-2xl sm:text-4xl font-black italic text-primary leading-tight">
                    "{activeMission.steps[currentStep]}"
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                 {activeMission.steps.map((_, idx) => (
                   <div 
                    key={idx} 
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4 rounded-full transition-all duration-500",
                      idx <= currentStep ? "bg-primary scale-125 shadow-md" : "bg-muted"
                    )} 
                   />
                 ))}
              </div>

              <Button variant="ghost" onClick={() => setActiveMissionId(null)} className="rounded-full font-black text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-lg">
                Stop Mission
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isDone ? (
        <Card className="rounded-[2.5rem] bg-accent/20 p-10 sm:p-14 text-center space-y-6 animate-in slide-in-from-bottom-10">
          <div className="glass-strong p-8 rounded-[3rem] inline-block mx-auto relative">
             <Award className="h-20 w-20 sm:h-28 sm:w-28 text-accent-foreground" />
             <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                <CheckCircle2 className="h-6 w-6 sm:h-8 w-8" />
             </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black">Mission Complete, {explorerName}!</h2>
            <p className="text-xl sm:text-2xl font-bold text-accent-foreground">Eyes supercharged! +50 Points.</p>
          </div>
          <Button onClick={() => setIsDone(false)} size="lg" className="rounded-full h-14 sm:h-18 px-10 sm:px-14 text-xl sm:text-3xl font-black bg-primary hover:bg-primary/90 shadow-xl hover:scale-105 transition-transform">
            Awesome!
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {MISSIONS.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.id} className="rounded-[2rem] border-2 border-transparent hover:border-primary/20 transition-all kid-card-hover group overflow-hidden">
                <CardHeader className="text-center space-y-2 pt-8">
                  <div className={cn(
                    "p-6 rounded-[1.5rem] inline-block mx-auto transition-transform group-hover:scale-110 shadow-inner",
                    m.color
                  )}>
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-black italic">{m.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center px-8 pb-8 space-y-6">
                  <p className="text-muted-foreground font-semibold leading-snug">{m.description}</p>
                  <div className="flex items-center justify-center text-xs font-black text-primary/60 space-x-2 bg-muted/30 py-2 rounded-full">
                    <Timer className="h-4 w-4" />
                    <span>Timed Eye Routine</span>
                  </div>
                  <Button onClick={() => startMission(m.id)} className="w-full rounded-full h-14 font-black text-xl shadow-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    Start Mission <ChevronRight className="ml-1 h-6 w-6" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10 flex items-start gap-4 shadow-inner">
        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-lg font-black text-primary italic">Pro Eye Secret</h4>
          <p className="text-muted-foreground font-medium text-xs leading-relaxed">
            The 20-20-20 rule: Every 20 mins, look 20 feet away for 20 secs. Keep exploring, {explorerName}!
          </p>
        </div>
      </div>
    </div>
  );
}
