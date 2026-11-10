"use client";

import { useState } from "react";
import { aiStoryChainCompanion, type StoryChainCompanionOutput } from "@/ai/flows/ai-story-chain-companion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, RotateCcw, PartyPopper, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function StoryChainPage() {
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const [story, setStory] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  // Fetch children to get the child's name dynamically
  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: childrenData, isLoading: isChildrenLoading } = useCollection(childrenQuery);

  const explorerName = childrenData?.[0]?.name || "Explorer";

  const startNewStory = async () => {
    setIsLoading(true);
    setIsComplete(false);
    try {
      const result = await aiStoryChainCompanion({
        currentStory: "",
        difficulty: "easy"
      });
      setStory(result.nextStorySegment);
      setFeedback("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextTurn = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const updatedStory = story + `\n\n${explorerName}: ` + input;
      const result = await aiStoryChainCompanion({
        currentStory: updatedStory,
        userContribution: input,
        difficulty: "easy"
      });
      setStory(updatedStory + "\n\nBuddy: " + result.nextStorySegment);
      setFeedback(result.feedback || "");
      setIsComplete(result.isStoryComplete);
      setInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChildrenLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-primary">{explorerName}'s Story Chain</h1>
        <p className="text-muted-foreground font-medium">Create a masterpiece with your AI Buddy, {explorerName}!</p>
      </div>

      <Card className="rounded-[2.5rem] border-2 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-8">
            {!story ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 rounded-full bg-primary/10">
                  <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold">Ready to write a legend, {explorerName}?</h2>
                <Button onClick={startNewStory} size="lg" className="rounded-full h-14 px-10 text-xl font-bold">
                  Start Adventure
                </Button>
              </div>
            ) : (
              <div className="space-y-4 whitespace-pre-wrap leading-relaxed font-medium">
                {story}
                {isComplete && (
                  <div className="bg-accent/20 p-6 rounded-3xl mt-8 flex flex-col items-center text-center space-y-3">
                    <PartyPopper className="h-10 w-10 text-accent-foreground" />
                    <h3 className="text-xl font-bold">Story Complete!</h3>
                    <p className="text-sm">Wow! What an incredible journey we wrote together, {explorerName}.</p>
                    <Button variant="outline" onClick={startNewStory} className="rounded-full mt-2">Write Another?</Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {story && !isComplete && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {feedback && (
            <div className="bg-accent/10 text-accent-foreground p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {feedback}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="What happens next? You decide..."
              className="rounded-3xl border-2 focus:ring-primary min-h-[100px] p-4 font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleNextTurn())}
            />
            <Button 
              disabled={isLoading || !input.trim()} 
              onClick={handleNextTurn}
              className="h-auto px-6 rounded-3xl"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex justify-between">
             <Button variant="ghost" onClick={startNewStory} className="text-muted-foreground">
               <RotateCcw className="mr-2 h-4 w-4" /> Start Over
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
