import { useState } from "react";
import { Coins, Star, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Student {
  id: number;
  name: string;
  points: number;
  experience: number;
}

interface StudentListProps {
  students: Student[];
  onUpdateStudent: (id: number, updates: Partial<Student>) => void;
}

const StudentList = ({ students, onUpdateStudent }: StudentListProps) => {
  const [mode, setMode] = useState<"none" | "points" | "experience">("none");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const handleStudentClick = (studentId: number) => {
    if (mode === "none") return;

    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const applyRewards = () => {
    selectedStudents.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId);
      if (student) {
        if (mode === "points") {
          onUpdateStudent(studentId, { points: student.points + 10 });
        } else if (mode === "experience") {
          onUpdateStudent(studentId, { experience: student.experience + 25 });
        }
      }
    });
    setSelectedStudents([]);
    setMode("none");
  };

  const cancelSelection = () => {
    setSelectedStudents([]);
    setMode("none");
  };

  return (
    <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <Button
          variant={mode === "experience" ? "kahoot" : "kahoot-secondary"}
          size="lg"
          onClick={() => setMode(mode === "experience" ? "none" : "experience")}
          className="flex-1"
        >
          <Star className="w-5 h-5" />
          Add XP
        </Button>
        <Button
          variant={mode === "points" ? "kahoot" : "kahoot-accent"}
          size="lg"
          onClick={() => setMode(mode === "points" ? "none" : "points")}
          className="flex-1"
        >
          <Coins className="w-5 h-5" />
          Add Points
        </Button>
      </div>

      {/* Selection Mode Banner */}
      {mode !== "none" && (
        <div className="bg-primary/10 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <p className="font-bold text-primary">
            Select students to add {mode === "points" ? "points" : "XP"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelSelection}>
              Cancel
            </Button>
            {selectedStudents.length > 0 && (
              <Button variant="kahoot" size="sm" onClick={applyRewards}>
                <Check className="w-4 h-4" />
                Apply ({selectedStudents.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="space-y-3">
        {students.map((student, index) => {
          const isSelected = selectedStudents.includes(student.id);
          const gradients = [
            "gradient-purple",
            "gradient-teal",
            "gradient-pink",
            "gradient-blue",
            "gradient-green",
            "gradient-orange",
          ];

          return (
            <div
              key={student.id}
              onClick={() => handleStudentClick(student.id)}
              className={cn(
                "rounded-2xl p-4 flex items-center justify-between transition-all duration-200",
                gradients[index % gradients.length],
                mode !== "none" && "cursor-pointer hover:scale-[1.02]",
                isSelected && "ring-4 ring-foreground/30 scale-[1.02]"
              )}
            >
              <div className="flex items-center gap-3">
                {mode !== "none" && (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center",
                      isSelected && "bg-white"
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                )}
                <span className="font-bold text-white text-lg drop-shadow-sm">
                  {student.name}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                  <Star className="w-4 h-4 text-yellow-200" />
                  <span className="font-bold text-white text-sm">
                    {student.experience} XP
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                  <Coins className="w-4 h-4 text-yellow-300" />
                  <span className="font-bold text-white text-sm">
                    {student.points}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentList;
