import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Star, Search, Phone, Mail, MapPin, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  image_url: string | null;
  experience_years: number;
  hospital: string | null;
  rating: number;
  total_reviews: number;
  available_days: string[];
  consultation_fee: number | null;
  phone: string | null;
  email: string | null;
}

interface Review {
  id: string;
  doctor_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface DoctorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const specialties = [
  "All Specialties",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Orthopedic Surgeon",
  "Neurologist",
  "General Practitioner",
];

const DoctorsDialog = ({ open, onOpenChange }: DoctorsDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors_public" as any)
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      return data as unknown as Doctor[];
    },
    enabled: open,
  });

  const { data: reviews } = useQuery({
    queryKey: ["doctor-reviews", selectedDoctor?.id],
    queryFn: async () => {
      if (!selectedDoctor) return [];
      const { data, error } = await supabase
        .from("doctor_reviews")
        .select("*")
        .eq("doctor_id", selectedDoctor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!selectedDoctor,
  });

  const addReview = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const { error } = await supabase.from("doctor_reviews").insert({
        doctor_id: selectedDoctor!.id,
        user_id: user!.id,
        rating: data.rating,
        comment: data.comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
      setNewReview({ rating: 5, comment: "" });
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  const filteredDoctors = doctors?.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.hospital?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "All Specialties" || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    onOpenChange(false);
    navigate("/appointments/new", { state: { doctor } });
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onSelect ? () => onSelect(star) : undefined}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
              } ${interactive ? "w-6 h-6" : ""}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open && !selectedDoctor} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Find a Doctor</DialogTitle>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, specialty, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctors Grid */}
          <ScrollArea className="h-[50vh] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredDoctors?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p>No doctors found matching your criteria</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDoctors?.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {doctor.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{doctor.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {doctor.specialty}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="flex items-center gap-2">
                        {renderStars(doctor.rating)}
                        <span className="text-xs text-muted-foreground">
                          ({doctor.total_reviews})
                        </span>
                      </div>
                      {doctor.hospital && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {doctor.hospital}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {doctor.experience_years} yrs exp
                        </span>
                        {doctor.consultation_fee && (
                          <span className="text-xs font-medium text-primary">
                            ${doctor.consultation_fee}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="sm:max-w-2xl bg-background border-border max-h-[85vh] overflow-y-auto">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                    {selectedDoctor.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedDoctor.name}</DialogTitle>
                    <Badge variant="outline" className="mt-1">
                      {selectedDoctor.specialty}
                    </Badge>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(selectedDoctor.rating)}
                      <span className="text-sm text-muted-foreground">
                        ({selectedDoctor.total_reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {selectedDoctor.bio && (
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">About</h3>
                    <p className="text-sm text-muted-foreground">{selectedDoctor.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm">Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.experience_years} years
                    </p>
                  </div>
                  {selectedDoctor.consultation_fee && (
                    <div>
                      <h3 className="font-semibold text-sm">Consultation Fee</h3>
                      <p className="text-sm text-primary font-medium">
                        ${selectedDoctor.consultation_fee}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDoctor.available_days?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Available Days
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.available_days.map((day) => (
                        <Badge key={day} variant="secondary" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-1 text-sm">Contact</h3>
                  <div className="space-y-1">
                    {selectedDoctor.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedDoctor.phone}
                      </p>
                    )}
                    {selectedDoctor.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedDoctor.email}
                      </p>
                    )}
                    {selectedDoctor.hospital && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {selectedDoctor.hospital}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reviews Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm">Reviews</h3>
                    {user && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewDialogOpen(true)}
                      >
                        Write a Review
                      </Button>
                    )}
                  </div>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className="p-3 rounded-lg bg-secondary border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                  )}
                </div>

                <Button className="w-full" onClick={() => handleBookAppointment(selectedDoctor)}>
                  Book Appointment
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Write Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addReview.mutate(newReview);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= newReview.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={addReview.isPending}>
              {addReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DoctorsDialog;
