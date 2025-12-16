import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Heart,
  ArrowLeft,
  Send,
  MessageSquare,
  Loader2,
  User,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  doctor_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  doctor: Doctor;
  lastMessage: Message | null;
  unreadCount: number;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchDoctors();
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDoctor && user) {
      fetchMessages(selectedDoctor.id);
      markMessagesAsRead(selectedDoctor.id);
    }
  }, [selectedDoctor, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !selectedDoctor) return;

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `doctor_id=eq.${selectedDoctor.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.receiver_id === user.id) {
              markMessagesAsRead(selectedDoctor.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedDoctor]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, specialty, image_url")
      .order("name");

    if (!error && data) {
      setDoctors(data);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: false });

    if (!error && messagesData) {
      // Group by doctor
      const doctorIds = [...new Set(messagesData.map(m => m.doctor_id))];
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, name, specialty, image_url")
        .in("id", doctorIds);

      if (doctorsData) {
        const convos: Conversation[] = doctorsData.map(doctor => {
          const doctorMessages = messagesData.filter(m => m.doctor_id === doctor.id);
          const unreadCount = doctorMessages.filter(
            m => m.receiver_id === user?.id && !m.is_read
          ).length;
          return {
            doctor,
            lastMessage: doctorMessages[0] || null,
            unreadCount,
          };
        });
        setConversations(convos);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (doctorId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("doctor_id", doctorId)
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async (doctorId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("doctor_id", doctorId)
      .eq("receiver_id", user?.id)
      .eq("is_read", false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDoctor || !user) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedDoctor.id, // For simplicity, doctor ID as receiver
      doctor_id: selectedDoctor.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      fetchMessages(selectedDoctor.id);
    }
    setSending(false);
  };

  const startConversation = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CareFlow</span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Chat with your healthcare providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="border-0 shadow-sm md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {/* Existing conversations */}
                    {conversations.map((convo) => (
                      <button
                        key={convo.doctor.id}
                        onClick={() => startConversation(convo.doctor)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedDoctor?.id === convo.doctor.id
                            ? "bg-primary/10"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={convo.doctor.image_url || undefined} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground text-sm">
                            Dr. {convo.doctor.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {convo.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                        {convo.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {convo.unreadCount}
                          </span>
                        )}
                      </button>
                    ))}

                    {/* Available doctors without conversation */}
                    {doctors
                      .filter(d => !conversations.find(c => c.doctor.id === d.id))
                      .map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => startConversation(doctor)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            selectedDoctor?.id === doctor.id
                              ? "bg-primary/10"
                              : "hover:bg-secondary"
                          }`}
                        >
                          <Avatar>
                            <AvatarImage src={doctor.image_url || undefined} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground text-sm">
                              Dr. {doctor.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doctor.specialty}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="border-0 shadow-sm md:col-span-2 flex flex-col">
            {selectedDoctor ? (
              <>
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedDoctor.image_url || undefined} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Dr. {selectedDoctor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4 h-[calc(100vh-480px)]">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No messages yet. Start the conversation!
                        </p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_id === user?.id ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-foreground"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.sender_id === user?.id
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <form onSubmit={sendMessage} className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button type="submit" disabled={sending || !newMessage.trim()}>
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a doctor to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
