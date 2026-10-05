import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, RefreshCw, Zap } from 'lucide-react';
import { getTopics, seedDefaultTopic } from '../services/topicsService';
import { getDashboardStats } from '../services/statsService';
import { formatAccuracy, formatSeconds } from '../utils/formatters';
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

      if (statsRes?.topicPerformance) {
        const map = {};
        statsRes.topicPerformance.forEach((p) => {
          map[p.id] = p;
        });
        setTopicStats(map);
      }
    } catch (e) {
      setError(e.message || 'Unexpected error loading topics');
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Topics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a topic to start practicing.
        </p>
      </div>

      {error && (
        <Alert variant="warning" title="Notice">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
          <p className="text-xs text-slate-400">Loading topics...</p>
        </div>
      )}

      {/* Empty State / Seed */}
      {!loading && topics.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-slate-600">No active topics found.</p>
          <button
            onClick={handleSeedTopic}
            disabled={seeding}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            {seeding ? 'Initializing...' : 'Initialize Fast Addition & Subtraction'}
          </button>
        </div>
      )}

      {/* Topic Cards */}
      {!loading && topics.length > 0 && (
        <div className="space-y-3">
          {topics.map((topic) => {
            const perf =
              topicStats[topic.id] ||
              topicStats[String(topic.id)] ||
              topicStats['fast-addition-subtraction'] ||
              topicStats['1'];
            const hasPracticeHistory = Boolean(perf && perf.testsCount > 0);

            return (
              <div
                key={topic.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                    <span className="text-xs font-semibold text-brand-600">
                      {topic.category || 'Quantitative Aptitude'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {topic.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Master rapid calculation speed and zero-error arithmetic.
                    </p>
                  </div>

                  {/* Real Stats if completed */}
                  {hasPracticeHistory && (
                    <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 pt-1">
                      <span>{perf.testsCount} {perf.testsCount === 1 ? 'drill' : 'drills'}</span>
                      <span>&middot;</span>
                      <span className="font-semibold text-emerald-600">
                        {formatAccuracy(perf.accuracy)} accuracy
                      </span>
                      <span>&middot;</span>
                      <span>{formatSeconds(perf.avgTimeMs)} / q</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/practice?topic=${encodeURIComponent(topic.id)}`}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-brand-600 transition-colors shadow-xs self-start sm:self-auto"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
