import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Logo / Title */}
      <div className="text-center mb-12 animate-bounce-in">
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-3">
          Class<span className="text-primary">Quiz</span>
        </h1>
        <p className="text-xl text-muted-foreground font-semibold">
          Make learning fun! 🎉
        </p>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-5 w-full max-w-xs animate-slide-up">
        <Button
          variant="kahoot"
          size="xl"
          onClick={() => navigate("/classes")}
          className="w-full"
        >
          <BookOpen className="w-7 h-7" />
          View Classes
        </Button>

        <Button
          variant="kahoot-secondary"
          size="xl"
          onClick={() => navigate("/add-class")}
          className="w-full"
        >
          <PlusCircle className="w-7 h-7" />
          Add a Class
        </Button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 gradient-yellow rounded-full opacity-40 blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 gradient-pink rounded-full opacity-30 blur-2xl" />
      <div className="absolute top-1/3 right-20 w-16 h-16 gradient-teal rounded-full opacity-35 blur-xl" />
    </div>
  );
};

export default Index;
