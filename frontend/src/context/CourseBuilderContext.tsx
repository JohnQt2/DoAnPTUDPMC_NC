// CourseBuilderContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Chapter = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  title: string;
  content: string;
};

interface CourseBuilderState {
  chapters: Chapter[];
  selectedLessonId: string | null;
  openChapters: Set<string>;
  searchQuery: string;
  setChapters: (chapters: Chapter[]) => void;
  selectLesson: (lessonId: string) => void;
  toggleChapter: (chapterId: string) => void;
  setSearchQuery: (q: string) => void;
}

const CourseBuilderContext = createContext<CourseBuilderState | undefined>(undefined);

export const useCourseBuilder = () => {
  const ctx = useContext(CourseBuilderContext);
  if (!ctx) throw new Error("useCourseBuilder must be used within CourseBuilderProvider");
  return ctx;
};

export const CourseBuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  // persist open chapters in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("openChapters");
    if (stored) setOpenChapters(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    localStorage.setItem("openChapters", JSON.stringify(Array.from(openChapters)));
  }, [openChapters]);

  const selectLesson = (lessonId: string) => setSelectedLessonId(lessonId);
  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  return (
    <CourseBuilderContext.Provider
      value={{
        chapters,
        selectedLessonId,
        openChapters,
        searchQuery,
        setChapters,
        selectLesson,
        toggleChapter,
        setSearchQuery,
      }}
    >
      {children}
    </CourseBuilderContext.Provider>
  );
};
