import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  Video,
  HeartPulse,
  FlaskConical,
  Ambulance,
  ArrowRight,
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Calendar,
      title: "Online Appointments",
      description: "Schedule appointments with doctors, specialists, and healthcare providers instantly.",
      features: ["24/7 booking", "Instant confirmation", "Reminders"],
    },
    {
      icon: Video,
      title: "Telemedicine",
      description: "Consult with healthcare providers from the comfort of your home via video calls.",
      features: ["HD video calls", "Screen sharing", "Digital prescriptions"],
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Access your complete medical history, test results, and health documents securely.",
      features: ["Secure storage", "Easy sharing", "Download reports"],
    },
    {
      icon: Pill,
      title: "Prescription Management",
      description: "Manage your medications, set reminders, and request refills with ease.",
      features: ["Refill reminders", "Drug interactions", "Pharmacy integration"],
    },
    {
      icon: FlaskConical,
      title: "Lab Results",
      description: "View your lab test results online as soon as they're available.",
      features: ["Quick access", "Historical data", "Trend analysis"],
    },
    {
      icon: HeartPulse,
      title: "Health Monitoring",
      description: "Track your vitals, symptoms, and health metrics over time.",
      features: ["Vital tracking", "Health insights", "Goal setting"],
    },
    {
      icon: Stethoscope,
      title: "Specialist Referrals",
      description: "Get connected with specialists and manage your referral process seamlessly.",
      features: ["Easy referrals", "Network access", "Care coordination"],
    },
    {
      icon: Ambulance,
      title: "Emergency Services",
      description: "Quick access to emergency contacts and nearest emergency facilities.",
      features: ["One-tap SOS", "Location sharing", "Emergency contacts"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-secondary py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive healthcare solutions designed to make your medical experience seamless and efficient.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Experience Better Healthcare?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Join CareFlow today and take control of your health journey.
            </p>
            <Link to="/signup">
              <Button variant="secondary" size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
