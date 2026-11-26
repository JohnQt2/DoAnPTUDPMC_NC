import React from 'react';
import { ExamListPage } from '../test/ExamListPage';

/**
 * Wrapper giữ tương thích ngược cho đường dẫn #/mock-exams,
 * sử dụng chung giao diện Đề thi HSK hợp nhất ở chế độ Mô phỏng thi thật.
 */
export const MockExamListPage: React.FC = () => {
  return <ExamListPage initialMode="MOCK_EXAM" />;
};

export default MockExamListPage;
