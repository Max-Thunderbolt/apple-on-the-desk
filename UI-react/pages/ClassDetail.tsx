import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Timer from "@/components/Timer";
import StudentList, { Student } from "@/components/StudentList";
import RankProgress from "@/components/RankProgress";
import { ArrowLeft } from "lucide-react";

// Mock data for classes
const classesData: Record<string, { name: string; students: Student[] }> = {
  "1": {
    name: "Grade 4M",
    students: [
      { id: 1, name: "Emma Johnson", points: 150, experience: 320 },
      { id: 2, name: "Liam Smith", points: 120, experience: 280 },
      { id: 3, name: "Olivia Brown", points: 180, experience: 450 },
      { id: 4, name: "Noah Davis", points: 90, experience: 200 },
      { id: 5, name: "Ava Wilson", points: 200, experience: 520 },
      { id: 6, name: "Mason Taylor", points: 75, experience: 150 },
    ],
  },
  "2": {
    name: "Grade 5V",
    students: [
      { id: 1, name: "Sophia Martinez", points: 220, experience: 580 },
      { id: 2, name: "James Anderson", points: 165, experience: 390 },
      { id: 3, name: "Isabella Thomas", points: 195, experience: 470 },
      { id: 4, name: "Benjamin Jackson", points: 140, experience: 310 },
    ],
  },
  "3": {
    name: "Grade 3A",
    students: [
      { id: 1, name: "Mia White", points: 85, experience: 180 },
      { id: 2, name: "Elijah Harris", points: 110, experience: 250 },
      { id: 3, name: "Charlotte Clark", points: 95, experience: 210 },
    ],
  },
};

const ClassDetail = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const classData = classesData[classId || "1"] || classesData["1"];
  const [students, setStudents] = useState<Student[]>(classData.students);

  const handleUpdateStudent = (id: number, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, ...updates } : student
      )
    );
  };

  const totalExperience = students.reduce((sum, s) => sum + s.experience, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-border">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/classes")}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-extrabold text-foreground">
            {classData.name}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Timer */}
        <Timer initialSeconds={60} autoRepeat={true} />

        {/* Student List */}
        <StudentList students={students} onUpdateStudent={handleUpdateStudent} />
      </div>

      {/* Rank Progress */}
      <RankProgress totalExperience={totalExperience} />
    </div>
  );
};

export default ClassDetail;
