"use client";

import { Navigation } from "@/components/Navigation";
import { LogOut, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";
import { KidsyeeLogo, KidsyeeTextLogo } from "@/components/Logo";
import { ParentPinGate, lockParentArea } from "@/components/ParentPinGate";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const parentRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "parentProfiles", user.uid);
  }, [db, user]);

  const { data: parentProfile, isLoading: isProfileLoading } = useDoc(parentRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleShare = async () => {
    const shareData = {
      title: 'Kidsyee - Eye & Brain Wellness',
      text: 'Check out Kidsyee, the ultimate screen time guardian for kids!',
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link Copied!",
        description: "App link copied to clipboard.",
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const parentDisplayName = parentProfile?.firstName || user.email?.split('@')[0] || "Parent";

  return (
    <ParentPinGate
      uid={user.uid}
      email={user.email}
      pinHash={parentProfile?.parentPinHash}
      isLoading={isProfileLoading}
      parentRef={parentRef}
    >
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="glass-strong h-20 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
           <Link href="/" className="flex items-center space-x-2 group">
             <div className="bg-primary p-2 rounded-xl text-white group-hover:rotate-12 transition-transform shadow-md">
                <KidsyeeLogo className="h-6 w-6" />
             </div>
             <KidsyeeTextLogo className="text-xl" />
           </Link>
        </div>
        
        <div className="flex items-center space-x-4">
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/kid/dashboard">
                    <Button variant="outline" size="sm" className="hidden sm:flex rounded-full border-primary/20 hover:bg-primary/5 text-primary font-bold">
                      <KidsyeeLogo className="mr-2 h-4 w-4" /> Eye Data
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to Wellness Dashboard</p>
                </TooltipContent>
              </Tooltip>
           </TooltipProvider>

           <div className="flex items-center gap-3 bg-muted/20 px-3 py-1.5 rounded-full border border-border/50">
             <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-sm">
               {parentDisplayName.substring(0, 1).toUpperCase()}
             </div>
             <span className="hidden sm:inline text-sm font-bold text-foreground pr-1">{parentDisplayName}</span>
             <Button variant="ghost" size="icon" onClick={() => { lockParentArea(); signOut(auth); }} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full">
               <LogOut className="h-4 w-4" />
             </Button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row relative">
        <aside className="glass-strong hidden md:flex w-64 p-6 flex-col sticky top-20 h-[calc(100vh-5rem)]">
          <div className="flex-1">
            <Navigation />
          </div>
          <div className="mt-auto pt-6 border-t">
            <Button onClick={handleShare} variant="outline" className="w-full rounded-2xl h-12 font-bold flex items-center justify-center gap-2 border-primary/20 hover:bg-primary/5 text-primary shadow-sm">
              <Share2 className="h-5 w-5" /> Share App
            </Button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-auto pb-32 md:pb-10">
          {children}
        </main>
      </div>
      
      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
    </ParentPinGate>
  );
}
