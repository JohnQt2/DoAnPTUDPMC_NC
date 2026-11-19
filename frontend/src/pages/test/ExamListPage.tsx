import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { FileText, Clock, Award, Play, CheckCircle2 } from 'lucide-react';

export const ExamListPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [sampleTest, setSampleTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, test1] = await Promise.all([
          api.get<any[]>('/assessment/submissions').catch(() => []),
          api.get<any>('/assessment/tests/1').catch(() => null),
        ]);
        setSubmissions(Array.isArray(subs) ? subs : []);
        setSampleTest(test1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exams = [
    {
      id: sampleTest?.testId || 1,
      title: sampleTest?.title || 'Đề kiểm tra HSK 1 – Bài 1: Chào hỏi & Pinyin',
      level: 'HSK 1',
      duration: `${sampleTest?.timeLimitMinutes || 15} phút`,
      passScore: `${sampleTest?.passScorePercent || 80}%`,
      desc: 'Kiểm tra nhận diện chữ Hán, thanh điệu Pinyin và câu giao tiếp cơ bản.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Đề thi & Kiểm tra</h1>
        <p className="text-sm text-gray-500 mt-1">
          Làm bài kiểm tra nhanh theo từng cấp độ HSK và xem lại lịch sử điểm số.
        </p>
      </div>

      {/* Available Exams */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-32 rounded-3xl bg-gray-100 animate-pulse" />
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="inline-block px-3 py-0.5 rounded-full bg-primary-50 text-primary-600 font-bold text-xs">
                  {exam.level}
                </span>
                <h2 className="text-lg font-bold text-gray-900">{exam.title}</h2>
                <p className="text-xs text-gray-500">{exam.desc}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    {exam.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-primary-500" />
                    Đạt từ {exam.passScore}
                  </span>
                </div>
              </div>

              <a
                href={`#/test/${exam.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-sm transition-colors shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Làm bài</span>
              </a>
            </div>
          ))
        )}
      </div>

      {/* Past Submissions */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-gray-900">Lịch sử làm bài</h3>
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-2">
            <FileText className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">Bạn chưa làm bài kiểm tra nào.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {submissions.map((sub: any) => {
              const id = sub.submissionId || sub.id;
              const score = Math.round(sub.scorePercent ?? sub.score ?? 0);
              const passed = sub.isPassed ?? score >= 80;
              return (
                <a
                  key={id}
                  href={`#/test-result/${id}`}
                  className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-primary-300 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${passed ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {sub.test?.title || `Bài kiểm tra #${id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {passed ? 'Đạt yêu cầu' : 'Cần ôn thêm'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-extrabold ${
                      passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {score}%
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

