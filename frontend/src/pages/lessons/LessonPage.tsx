import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { HanziCanvas } from '../../components/HanziCanvas';
import { PitchVisualizer } from '../../components/PitchVisualizer';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';

export const LessonPage: React.FC<{ lessonId: number }> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const data = await api.get<any>(`/curriculum/lessons/${lessonId}`);
      setLesson(data);
      setCurrentBlockIdx(0);
    } catch (err) {
      console.error('Failed to load lesson:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextBlock = () => {
    if (lesson?.blocks && currentBlockIdx < lesson.blocks.length - 1) {
      setCurrentBlockIdx((prev) => prev + 1);
    }
  };

  const handlePrevBlock = () => {
    if (currentBlockIdx > 0) {
      setCurrentBlockIdx((prev) => prev - 1);
    }
  };

  const playSpeech = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis?.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="h-20 rounded-3xl bg-gray-100 animate-pulse" />
        <div className="h-96 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-500">Không tìm thấy bài học này.</p>
        <a href="#/courses" className="text-primary-600 font-bold underline">
          Quay lại danh sách khóa học
        </a>
      </div>
    );
  }

  const blocks = lesson.blocks || [];
  const currentBlock = blocks[currentBlockIdx];
  const progressPercent = blocks.length > 0 ? Math.round(((currentBlockIdx + 1) / blocks.length) * 100) : 0;

  // Parse block content safely
  let blockContent: any = {};
  try {
    if (currentBlock?.content_json) {
      blockContent = JSON.parse(currentBlock.content_json);
    }
  } catch {
    blockContent = {};
  }

  const linkedTestId = lesson.tests && lesson.tests.length > 0 ? lesson.tests[0].test_id : null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Navigation & Progress */}
      <div className="flex items-center justify-between">
        <a
          href={`#/courses/${lesson.chapter?.course_id || 1}`}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chương
        </a>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">
            Nội dung {currentBlockIdx + 1} / {blocks.length}
          </span>
          <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lesson Header */}
      <div className="text-center space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
          {lesson.chapter?.title || 'Chương học'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {lesson.title}
        </h1>
      </div>

      {/* Dynamic Content Block Display */}
      {currentBlock ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-6 animate-fade-in">
          {/* Tag Type */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-extrabold text-xs uppercase tracking-wider">
              {currentBlock.block_type}
            </span>
            <span className="text-xs text-gray-400">
              Phần {currentBlockIdx + 1}
            </span>
          </div>

          {/* THEORY BLOCK */}
          {currentBlock.block_type === 'THEORY' && (
            <div className="space-y-4">
              {blockContent.title && (
                <h3 className="text-xl font-bold text-gray-900">{blockContent.title}</h3>
              )}
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {blockContent.content || 'Nội dung kiến thức bài học.'}
              </p>
            </div>
          )}

          {/* PINYIN BLOCK */}
          {currentBlock.block_type === 'PINYIN' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Hướng Dẫn Ngữ Âm & Quy Tắc</h3>
              {blockContent.rule && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed">
                  💡 <strong>Quy tắc quan trọng:</strong> {blockContent.rule}
                </div>
              )}

              {blockContent.syllables && (
                <div className="flex flex-wrap gap-4 justify-center py-4">
                  {blockContent.syllables.map((syl: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => playSpeech(syl)}
                      className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-800 font-bold text-xl shadow-sm hover:scale-105 transition-all"
                    >
                      <Volume2 className="w-5 h-5 text-primary-600" />
                      <span>{syl}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HANZI / WRITING BLOCK */}
          {currentBlock.block_type === 'HANZI' && (
            <div className="space-y-6 flex flex-col items-center">
              {blockContent.character ? (
                <HanziCanvas
                  character={blockContent.character}
                  pinyin={blockContent.pinyin || ''}
                  meaning={blockContent.meaning || ''}
                  sinoVietnamese={blockContent.sinoVietnamese || ''}
                  strokesCount={blockContent.strokesCount || 6}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">Không có dữ liệu chữ Hán.</div>
              )}
            </div>
          )}

          {/* AUDIO & DIALOGUE BLOCK */}
          {currentBlock.block_type === 'AUDIO' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Hội Thoại Mẫu Thực Tế</h3>
              <div className="space-y-3">
                {blockContent.dialogue?.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                          {d.speaker}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{d.hanzi}</span>
                        <span className="text-sm font-semibold text-primary-600">({d.pinyin})</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-8">{d.meaning}</p>
                    </div>

                    <button
                      onClick={() => playSpeech(d.hanzi)}
                      className="p-2.5 rounded-xl bg-white hover:bg-primary-50 border border-gray-200 text-gray-600 hover:text-primary-600 transition-colors shadow-sm"
                      title="Nghe hội thoại"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center text-gray-500 border border-gray-100">
          Bài học này hiện chưa có nội dung.
        </div>
      )}

      {/* Bottom Step Controls */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handlePrevBlock}
          disabled={currentBlockIdx === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          Phần trước
        </button>

        {currentBlockIdx < blocks.length - 1 ? (
          <button
            onClick={handleNextBlock}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all hover:scale-105"
          >
            Tiếp tục
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          linkedTestId && (
            <a
              href={`#/test/${linkedTestId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-md shadow-accent-600/20 transition-all hover:scale-105"
            >
              <FileQuestion className="w-4 h-4" />
              Làm bài kiểm tra để mở khóa bài tiếp
            </a>
          )
        )}
      </div>
    </div>
  );
};
