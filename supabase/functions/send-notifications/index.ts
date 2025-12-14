import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "appointment_reminder" | "medication_alert" | "refill_reminder";
  user_id: string;
  data: {
    appointment_date?: string;
    appointment_time?: string;
    doctor_name?: string;
    medication_name?: string;
    dosage?: string;
    pills_remaining?: number;
    refill_date?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, user_id, data }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for user ${user_id}`);

    // Get user's email from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, first_name")
      .eq("user_id", user_id)
      .maybeSingle();

    if (profileError || !profile?.email) {
      console.error("Profile error:", profileError);
      throw new Error("User email not found");
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "appointment_reminder":
        subject = `Appointment Reminder - ${data.doctor_name}`;
        htmlContent = `
          <h1>Appointment Reminder</h1>
          <p>Dear ${profile.first_name || "Patient"},</p>
          <p>This is a reminder about your upcoming appointment:</p>
          <ul>
            <li><strong>Doctor:</strong> ${data.doctor_name}</li>
            <li><strong>Date:</strong> ${data.appointment_date}</li>
            <li><strong>Time:</strong> ${data.appointment_time}</li>
          </ul>
          <p>Please arrive 15 minutes early to complete any necessary paperwork.</p>
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <br>
          <p>Best regards,<br>Your Healthcare Team</p>
        `;
        break;

      case "medication_alert":
        subject = `Medication Reminder - ${data.medication_name}`;
        htmlContent = `
          <h1>Medication Reminder</h1>
          <p>Dear ${profile.first_name || "Patient"},</p>
          <p>This is a reminder to take your medication:</p>
          <ul>
            <li><strong>Medication:</strong> ${data.medication_name}</li>
            <li><strong>Dosage:</strong> ${data.dosage}</li>
          </ul>
          <p>Remember to take your medication as prescribed by your doctor.</p>
          <br>
          <p>Best regards,<br>Your Healthcare Team</p>
        `;
        break;

      case "refill_reminder":
        subject = `Refill Reminder - ${data.medication_name}`;
        htmlContent = `
          <h1>Prescription Refill Reminder</h1>
          <p>Dear ${profile.first_name || "Patient"},</p>
          <p>Your prescription is running low:</p>
          <ul>
            <li><strong>Medication:</strong> ${data.medication_name}</li>
            <li><strong>Pills Remaining:</strong> ${data.pills_remaining}</li>
            ${data.refill_date ? `<li><strong>Refill Date:</strong> ${data.refill_date}</li>` : ""}
          </ul>
          <p>Please request a refill or contact your doctor to renew your prescription.</p>
          <br>
          <p>Best regards,<br>Your Healthcare Team</p>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    const emailResponse = await resend.emails.send({
      from: "Healthcare <onboarding@resend.dev>",
      to: [profile.email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent", data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
