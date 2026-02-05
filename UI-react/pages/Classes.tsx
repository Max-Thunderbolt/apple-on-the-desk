import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ClassCard from "@/components/ClassCard";
import { ArrowLeft, PlusCircle } from "lucide-react";

const gradientClasses = [
  "gradient-purple",
  "gradient-teal",
  "gradient-pink",
  "gradient-yellow",
  "gradient-blue",
  "gradient-green",
  "gradient-orange",
  "gradient-coral",
];

// Mock data for classes
const mockClasses = [
  { id: 1, name: "Grade 4M", studentCount: 24 },
  { id: 2, name: "Grade 5V", studentCount: 28 },
  { id: 3, name: "Grade 3A", studentCount: 22 },
  { id: 4, name: "Grade 6B", studentCount: 26 },
  { id: 5, name: "Grade 2K", studentCount: 20 },
  { id: 6, name: "Grade 7C", studentCount: 30 },
];

const Classes = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-3xl font-extrabold text-foreground">My Classes</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/add-class")}
          className="text-primary"
        >
          <PlusCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {mockClasses.map((classItem, index) => (
          <ClassCard
            key={classItem.id}
            name={classItem.name}
            studentCount={classItem.studentCount}
            gradientClass={gradientClasses[index % gradientClasses.length]}
            onClick={() => navigate(`/classes/${classItem.id}`)}
          />
        ))}
      </div>

      {/* Empty State (if no classes) */}
      {mockClasses.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-6">
            No classes yet! Let's create one 🎓
          </p>
          <Button
            variant="kahoot"
            size="lg"
            onClick={() => navigate("/add-class")}
          >
            <PlusCircle className="w-6 h-6" />
            Add Your First Class
          </Button>
        </div>
      )}

      {/* Decorative elements */}
      <div className="fixed top-20 right-5 w-24 h-24 gradient-purple rounded-full opacity-20 blur-2xl pointer-events-none" />
      <div className="fixed bottom-10 left-5 w-32 h-32 gradient-teal rounded-full opacity-20 blur-2xl pointer-events-none" />
    </div>
  );
};

export default Classes;
