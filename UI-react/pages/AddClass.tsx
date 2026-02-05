import { useState } from "react";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AddClass = () => {
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [studentList, setStudentList] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    // Parse student names
    const students = studentList
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    console.log("Creating class:", { className, students });

    toast.success(`Class "${className}" created with ${students.length} students! 🎉`);
    router.push("/classes");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      {/* <div className="flex items-center gap-4 mb-8 animate-slide-up">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-3xl font-extrabold text-foreground">Add a Class</h1>
      </div> */}

      {/* Form Card */}
      <div className="max-w-md mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="bg-card rounded-3xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Name Field */}
            <div className="space-y-2">
              <Label htmlFor="className" className="text-lg font-bold text-foreground">
                Class Name
              </Label>
              <Input
                id="className"
                placeholder="e.g. Grade 4M"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="h-14 text-lg rounded-xl border-2 border-border focus:border-primary transition-colors"
              />
            </div>

            {/* Student List Field */}
            <div className="space-y-2">
              <Label htmlFor="studentList" className="text-lg font-bold text-foreground">
                Student Names
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter one student name per line
              </p>
              <Textarea
                id="studentList"
                placeholder="John Smith&#10;Jane Doe&#10;Alex Johnson&#10;..."
                value={studentList}
                onChange={(e) => setStudentList(e.target.value)}
                className="min-h-[200px] text-base rounded-xl border-2 border-border focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* File Upload Hint */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Tip: Copy and paste names from a spreadsheet!
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="kahoot"
              size="lg"
              className="w-full mt-4"
            >
              <Sparkles className="w-6 h-6" />
              Create Class
            </Button>
          </form>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-1/4 left-5 w-20 h-20 gradient-yellow rounded-full opacity-30 blur-xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-5 w-28 h-28 gradient-pink rounded-full opacity-25 blur-2xl pointer-events-none" />
    </div>
  );
};

export default AddClass;
