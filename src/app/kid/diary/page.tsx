"use client";

import { useState, useEffect, useRef } from "react";
import { aiDiaryBuddy, type DiaryBuddyOutput } from "@/ai/flows/ai-diary-buddy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, Book, Heart, Star, Moon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function DiaryPage() {
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const [messages, setMessages] = useState<{ role: 'user' | 'buddy', text: string, emoji?: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch children to get the "Explorer" name dynamically
  const childrenQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "parentProfiles", user.uid, "childProfiles");
  }, [db, user]);

  const { data: childrenData, isLoading: isChildrenLoading } = useCollection(childrenQuery);

  const explorerName = childrenData?.[0]?.name || "Explorer";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const result = await aiDiaryBuddy({
        diaryEntry: messages.map(m => m.text).join("\n"),
        userMessage: userText,
        childName: explorerName
      });

      setMessages(prev => [...prev, { 
        role: 'buddy', 
        text: result.buddyResponse + " " + result.reflectionPrompt,
        emoji: result.moodEmoji 
      }]);
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
        <div className="inline-block p-4 rounded-full bg-purple-100 mb-2">
          <Book className="h-10 w-10 text-purple-600" />
        </div>
        <h1 className="text-4xl font-black text-primary">My Diary Buddy</h1>
        <p className="text-muted-foreground font-medium">Tell me about your day, {explorerName}! I'm all ears. 👂</p>
      </div>

      <Card className="rounded-[2.5rem] border-2 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[450px] p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                <p className="font-bold">Say "Hi" or tell me what you did today!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex flex-col max-w-[85%] space-y-1",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-3xl font-medium text-sm md:text-base shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-white rounded-br-none" 
                        : "bg-white border-2 border-primary/10 text-foreground rounded-bl-none"
                    )}>
                      {msg.text}
                      {msg.emoji && <span className="ml-2 text-xl">{msg.emoji}</span>}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex mr-auto items-start">
                    <div className="bg-white border-2 border-primary/10 p-4 rounded-3xl rounded-bl-none animate-pulse">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Today I went to the park and..."
            className="rounded-[2rem] border-2 focus:ring-primary min-h-[80px] p-4 font-medium resize-none shadow-inner"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
          />
          <Button 
            disabled={isLoading || !input.trim()} 
            onClick={handleSendMessage}
            className="h-auto px-6 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-lg transition-all active:scale-95"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex justify-center gap-4">
           <Button variant="ghost" size="sm" onClick={() => setInput(prev => prev + "Today was awesome! ")} className="rounded-full text-xs font-bold text-muted-foreground hover:bg-primary/5">
             <Star className="h-3 w-3 mr-1" /> Awesome Day
           </Button>
           <Button variant="ghost" size="sm" onClick={() => setInput(prev => prev + "I learned something new: ")} className="rounded-full text-xs font-bold text-muted-foreground hover:bg-primary/5">
             <Heart className="h-3 w-3 mr-1" /> Learned New
           </Button>
           <Button variant="ghost" size="sm" onClick={() => setInput(prev => prev + "I'm feeling a bit tired. ")} className="rounded-full text-xs font-bold text-muted-foreground hover:bg-primary/5">
             <Moon className="h-3 w-3 mr-1" /> Feeling Tired
           </Button>
        </div>
      </div>
    </div>
  );
}