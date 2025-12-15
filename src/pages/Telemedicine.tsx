import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DailyIframe from "@daily-co/daily-js";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ArrowLeft,
  Loader2,
  Heart,
  Calendar,
} from "lucide-react";

interface Appointment {
  id: string;
  doctor_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
}

const Telemedicine = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appointmentId && user) {
      fetchAppointment();
    } else {
      setLoading(false);
    }
  }, [appointmentId, user]);

  const fetchAppointment = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("user_id", user?.id)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Appointment not found.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setAppointment(data);
    setLoading(false);
  };

  const joinCall = async () => {
    if (!appointment) return;

    setJoining(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-video-room", {
        body: { appointmentId: appointment.id },
      });

      if (error || !data?.url) {
        throw new Error("Failed to create video room");
      }

      if (containerRef.current) {
        callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "12px",
          },
          showLeaveButton: false,
          showFullscreenButton: true,
        });

        callFrameRef.current.on("left-meeting", () => {
          setInCall(false);
          if (callFrameRef.current) {
            callFrameRef.current.destroy();
            callFrameRef.current = null;
          }
        });

        await callFrameRef.current.join({ url: data.url });
        setInCall(true);
      }
    } catch (error) {
      console.error("Error joining call:", error);
      toast({
        title: "Error",
        description: "Failed to join video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const leaveCall = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setInCall(false);
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!appointmentId ? (
          <Card className="border-0 shadow-sm">
            <CardHeader className="text-center">
              <Video className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle>Telemedicine Consultation</CardTitle>
              <CardDescription>
                Select an appointment from your dashboard to start a video consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/dashboard">
                <Button className="gap-2">
                  <Calendar className="w-4 h-4" />
                  View Appointments
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Appointment Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Consultation with {appointment?.doctor_name}
                    </h2>
                    <p className="text-muted-foreground">{appointment?.doctor_specialty}</p>
                  </div>
                  {!inCall && (
                    <Button onClick={joinCall} disabled={joining} className="gap-2">
                      {joining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          Join Video Call
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Container */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div
                ref={containerRef}
                className="aspect-video bg-muted flex items-center justify-center min-h-[400px]"
              >
                {!inCall && !joining && (
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Click "Join Video Call" to start your consultation
                    </p>
                  </div>
                )}
                {joining && (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Setting up your video call...</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls */}
            {inCall && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant={videoEnabled ? "outline" : "destructive"}
                      size="lg"
                      onClick={toggleVideo}
                      className="gap-2"
                    >
                      {videoEnabled ? (
                        <>
                          <Video className="w-5 h-5" />
                          Camera On
                        </>
                      ) : (
                        <>
                          <VideoOff className="w-5 h-5" />
                          Camera Off
                        </>
                      )}
                    </Button>
                    <Button
                      variant={audioEnabled ? "outline" : "destructive"}
                      size="lg"
                      onClick={toggleAudio}
                      className="gap-2"
                    >
                      {audioEnabled ? (
                        <>
                          <Mic className="w-5 h-5" />
                          Mic On
                        </>
                      ) : (
                        <>
                          <MicOff className="w-5 h-5" />
                          Mic Off
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={leaveCall}
                      className="gap-2"
                    >
                      <PhoneOff className="w-5 h-5" />
                      End Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Telemedicine;
