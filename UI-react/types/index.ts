export interface Class {
  id: string;
  name: string;
  experience: number;
  students: Student[];
  createdAt: number;
}

export interface Student {
  id: string;
  name: string;
  points: number;
  experience?: number;
}

export interface Rank {
  name: string;
  minExperience: number;
  color: string;
  icon: string;
}
