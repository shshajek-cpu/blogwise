"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  scheduled_at: string;
  status: string;
  category?: { name: string; slug: string };
}

export default function SchedulePage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [batchGenerating, setBatchGenerating] = useState(false);

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=scheduled');
      const data = await response.json();
      setScheduledPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!confirm('트렌딩 키워드를 기반으로 일괄 생성하시겠습니까?')) return;

    setBatchGenerating(true);
    try {
      // Step 1: Fetch trending keywords
      const keywordsResponse = await fetch('/api/crawl/keywords');
      if (!keywordsResponse.ok) throw new Error('키워드를 가져오지 못했습니다.');
      const keywordsData = await keywordsResponse.json();
      const topKeywords = (keywordsData.keywords || []).slice(0, 7);

      if (topKeywords.length === 0) {
        alert('생성할 키워드가 없습니다.');
        return;
      }

      // Step 2: Generate posts for each keyword
      const now = new Date();
      const generatedPosts = [];

      for (let i = 0; i < topKeywords.length; i++) {
        const keyword = topKeywords[i];
        const scheduledDate = addDays(now, i + 1);

        try {
          // Generate post content
          const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword: keyword.keyword || keyword,
              provider: 'moonshot',
            }),
          });

          if (!generateResponse.ok) throw new Error('포스트 생성에 실패했습니다.');
          const generateData = await generateResponse.json();

          if (generateData.success && generateData.content) {
            // Create scheduled post
            const createResponse = await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: generateData.content.title || `${keyword.keyword || keyword} 완벽 가이드`,
                slug: generateData.content.slug || `guide-${i + 1}`,
                content: generateData.content.content || generateData.content.body || '',
                excerpt: generateData.content.excerpt || generateData.content.description || '',
                status: 'scheduled',
                scheduled_at: scheduledDate.toISOString(),
                category_id: null,
                read_time_minutes: 5,
              }),
            });

            if (!createResponse.ok) throw new Error('포스트 저장에 실패했습니다.');
            const createData = await createResponse.json();
            if (createData.post) {
              generatedPosts.push(createData.post);
            }
          }
        } catch (err) {
          console.error(`Error generating post for keyword: ${keyword}`, err);
        }
      }

      alert(`${generatedPosts.length}개의 포스트가 생성되고 스케줄되었습니다.`);
      loadScheduledPosts();
    } catch (error) {
      console.error('Batch generation error:', error);
      alert('일괄 생성 중 오류가 발생했습니다.');
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleReschedule = async (postId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: newDate.toISOString(),
        }),
      });

      if (response.ok) {
        loadScheduledPosts();
      }
    } catch (error) {
      console.error('Error rescheduling post:', error);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) => {
      const scheduledDate = new Date(post.scheduled_at);
      return (
        scheduledDate.getFullYear() === date.getFullYear() &&
        scheduledDate.getMonth() === date.getMonth() &&
        scheduledDate.getDate() === date.getDate()
      );
    });
  };

  const weekDays = getWeekDays();

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
            <p className="text-sm text-gray-500 mt-1">예약된 포스트를 관리하고 일괄 생성합니다</p>
          </div>
          <button
            onClick={handleBatchGenerate}
            disabled={batchGenerating}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {batchGenerating ? '생성 중...' : '🤖 일괄 생성'}
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-900">
          {format(currentWeekStart, 'yyyy년 M월', { locale: ko })}
        </span>
        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="p-4 text-center border-r border-gray-200 last:border-r-0"
            >
              <div className="text-xs text-gray-500 font-medium">
                {format(day, 'E', { locale: ko })}
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((day) => {
            const postsForDay = getPostsForDate(day);
            return (
              <div
                key={day.toISOString()}
                className="min-h-[200px] p-3 border-r border-b border-gray-200 last:border-r-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const postId = e.dataTransfer.getData('postId');
                  if (postId) {
                    handleReschedule(postId, day);
                  }
                }}
              >
                {postsForDay.map((post) => (
                  <div
                    key={post.id}
                    className="mb-2 p-2 bg-primary-50 border border-primary-200 rounded text-xs cursor-move hover:bg-primary-100 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('postId', post.id);
                      e.dataTransfer.setData('currentDate', post.scheduled_at);
                    }}
                  >
                    <div className="font-medium text-gray-900 line-clamp-2">
                      {post.title}
                    </div>
                    <div className="text-gray-500 mt-1">
                      {format(new Date(post.scheduled_at), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Posts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">예정된 포스트</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {scheduledPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              예정된 포스트가 없습니다.
            </div>
          ) : (
            scheduledPosts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>📅 {format(new Date(post.scheduled_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                      {post.category && (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">
                          {post.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/admin/contents?post=${post.id}`}
                    className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    편집
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
