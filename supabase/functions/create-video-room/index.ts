import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    
    if (!DAILY_API_KEY) {
      console.error("DAILY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Video service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { appointmentId } = await req.json();
    console.log("Creating room for appointment:", appointmentId);

    // Create a Daily.co room
    const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `careflow-${appointmentId}-${Date.now()}`,
        privacy: "public",
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text();
      console.error("Daily.co API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create video room" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const room = await roomResponse.json();
    console.log("Room created successfully:", room.url);

    return new Response(
      JSON.stringify({ url: room.url, name: room.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating video room:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
