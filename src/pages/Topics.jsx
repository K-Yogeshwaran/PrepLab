import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calculator, ArrowRight, RefreshCw, CheckCircle2, Play } from 'lucide-react';
import { getTopics, seedDefaultTopic } from '../services/topicsService';
import { getDashboardStats } from '../services/statsService';
import { getTopicGenerator } from '../generators';
import { formatAccuracy, formatSeconds } from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [topicStats, setTopicStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopicsAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [topicsRes, statsRes] = await Promise.all([
        getTopics(),
        getDashboardStats(),
      ]);

      if (topicsRes.error && (!topicsRes.data || topicsRes.data.length === 0)) {
        setError(topicsRes.error.message || 'Failed to load topics from database');
      } else {
        setTopics(topicsRes.data || []);
      }

      // Map topic performance stats if available
      if (statsRes?.topicPerformance) {
        const map = {};
        statsRes.topicPerformance.forEach((p) => {
          map[p.id] = p;
        });
        setTopicStats(map);
      }
    } catch (e) {
      setError(e.message || 'Unexpected error loading curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicsAndStats();
  }, []);

  const handleSeedTopic = async () => {
    setSeeding(true);
    try {
      await seedDefaultTopic();
      await fetchTopicsAndStats();
    } catch (err) {
      setError('Could not seed topic to database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <span>Curriculum Catalog</span>
          <span>&middot;</span>
          <span>Syllabus Modules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Study Modules
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Core quantitative aptitude modules. Master fundamentals through timed drills before advancing to complex multi-step topics.
        </p>
      </div>

      {error && (
        <Alert variant="warning" title="Database Notice">
          {error}. Please verify your database connection.
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-brand-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading curriculum modules...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && topics.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No topics found in Supabase"
          description="The topics table in your database is empty. Click below to initialize Fast Addition & Subtraction or run schema.sql in your Supabase SQL editor."
          actionText={seeding ? 'Initializing...' : 'Seed Fast Addition & Subtraction'}
          onAction={handleSeedTopic}
        />
      )}

      {/* Active Modules List */}
      {!loading && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic, index) => {
            const generator = getTopicGenerator(topic.id) || getTopicGenerator(topic.name);
            const perf = topicStats[topic.id] || topicStats[String(topic.id)] || topicStats['fast-addition-subtraction'] || topicStats['1'];
            const hasPracticeHistory = Boolean(perf && perf.testsCount > 0);

            return (
              <div
                key={topic.id}
                className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Module {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-semibold text-brand-700">
                      {topic.category || 'Quantitative Aptitude'}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      Active
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {topic.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {generator?.description ||
                        'Master rapid mental calculation and near-base adjustments to maximize score speed in aptitude exams.'}
                    </p>
                  </div>

                  {/* Real Historical Performance or "Not practiced yet" */}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                    {hasPracticeHistory ? (
                      <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Drills Done:</span>
                          <span className="font-mono font-bold text-slate-800">{perf.testsCount}</span>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-slate-400 block text-[10px]">Avg Accuracy:</span>
                          <span className="font-mono font-bold text-brand-700">{formatAccuracy(perf.accuracy)}</span>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-slate-400 block text-[10px]">Avg Speed:</span>
                          <span className="font-mono font-bold text-slate-800">{formatSeconds(perf.avgTimeMs)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                        Not practiced yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action */}
                <div className="flex-shrink-0 self-start md:self-center">
                  <Link
                    to={`/practice?topic=${encodeURIComponent(topic.id)}`}
                    className="inline-flex items-center px-4 py-2.5 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 mr-2 fill-white" />
                    Configure Drill
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
