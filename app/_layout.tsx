import { studentsTable } from '@/db/schema';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { db } from '../db/client';
import { seedStudentsIfEmpty } from '../db/seed';

export type Student = {
  id: number;
  name: string;
  major: string;
  year: string;
  count: number;
};

type StudentContextType = {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
};

export const StudentContext =
  createContext<StudentContextType | null>(null);

export default function RootLayout() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      await seedStudentsIfEmpty();
      const rows = await db.select().from(studentsTable);
      setStudents(rows);
    };

    fetchData();
  }, []);

  return (
    <StudentContext.Provider value={{ students, setStudents }}>
      <Stack />
    </StudentContext.Provider>
  );
}