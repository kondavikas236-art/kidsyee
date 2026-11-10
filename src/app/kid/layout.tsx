"use client";

import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { Lock, Loader2 } from "lucide-react";
import { CockroachOverlay } from "@/components/CockroachOverlay";
import { useEffect, useState } from "react";
import { SnakeOverlay } from "@/components/SnakeOverlay";
import { lockParentArea } from "@/components/ParentPinGate";

const CREATURE_SWAP_MS = 20_000;
import { useScreenTime } from "@/hooks/use-screen-time";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useFirebase, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { KidsyeeLogo, KidsyeeTextLogo } from "@/components/Logo";

export default function KidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore: db } = useFirebase();
  const avatar = PlaceHolderImages.find(img => img.id === 'avatar-buddy');
  
  const router = useRouter();
  const { minutes: usedMinutes, isOnBreakGrace, startBreakGrace } = useScreenTime();

  // Coming back to kid mode locks the parent section again.
  useEffect(() => { lockParentArea(); }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user, router]);

  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: childrenData, isLoading: isChildrenLoading } = useCollection(childrenQuery);
  const child = childrenData?.[0];
  const explorerName = child?.name || "Explorer";

  const childRef = useMemoFirebase(() => {
    if (!db || !user || !child?.id) return null;
    return doc(db, "parentProfiles", user.uid, "childProfiles", child.id);
  }, [db, user, child?.id]);

  const { data: liveChild } = useDoc(childRef);

  // Parent's Cockroach Mode switch lives on the parent profile, so it applies on every device.
  const parentRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "parentProfiles", user.uid);
  }, [db, user]);
  const { data: parentProfile } = useDoc(parentRef);
  const cockroachEnabled = parentProfile?.enableCockroachDeterrent !== false;

  const isSafeZone = pathname === "/kid/eye-health";
  const dailyLimit = liveChild?.dailyScreenTimeLimitMinutes || 120;
  const limitReached = usedMinutes >= dailyLimit;
  const shouldDisplayCreatures = cockroachEnabled && limitReached && !isOnBreakGrace && !isSafeZone;

  // Cockroaches and snakes take turns while the limit is exceeded.
  const [creature, setCreature] = useState<"cockroach" | "snake">("cockroach");
  useEffect(() => {
    if (!shouldDisplayCreatures) return;
    const id = setInterval(() => setCreature((c) => (c === "cockroach" ? "snake" : "cockroach")), CREATURE_SWAP_MS);
    return () => clearInterval(id);
  }, [shouldDisplayCreatures]);

  useEffect(() => {
    const handleBreakCompleted = () => startBreakGrace();
    window.addEventListener('mindful-play:break-completed', handleBreakCompleted);
    return () => window.removeEventListener('mindful-play:break-completed', handleBreakCompleted);
  }, [startBreakGrace]);

  if (isAuthLoading || isChildrenLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:flex-row relative overflow-x-hidden">
      <CockroachOverlay active={shouldDisplayCreatures && creature === "cockroach"} />
      <SnakeOverlay active={shouldDisplayCreatures && creature === "snake"} />
      
      <div className="hidden md:flex md:w-64 md:flex-col glass-strong md:m-4 md:mr-0 md:rounded-[2rem]">
        <div className="p-8">
           <Link href="/">
             <div className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
                <KidsyeeLogo className="h-12 w-12 text-primary" />
                <KidsyeeTextLogo className="text-2xl" />
             </div>
           </Link>
        </div>
        <Navigation />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-auto scrollbar-hide">
        <header className="glass-strong flex justify-between items-center p-5 sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-primary ring-2 ring-primary/5">
              <AvatarImage src={avatar?.imageUrl} alt="Explorer Avatar" />
              <AvatarFallback>EX</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Eye Data</p>
              <p className="text-base font-black tracking-tight leading-none">{explorerName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/parent/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary">
                <Lock className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </header>
        
        <div className="p-4 pb-32 sm:p-6 sm:pb-32 md:pb-6 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
  );
}
