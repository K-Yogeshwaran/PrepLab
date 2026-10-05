import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getTopics, seedDefaultTopic } from '../services/topicsService';
import { getTopicGenerator } from '../generators';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopicsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await getTopics();
      if (err && (!data || data.length === 0)) {
        setError(err.message || 'Failed to load topics from Supabase');
      } else {
        setTopics(data || []);
      }
    } catch (e) {
      setError(e.message || 'Unexpected error loading topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicsList();
  }, []);

  const handleSeedTopic = async () => {
    setSeeding(true);
    try {
      await seedDefaultTopic();
      await fetchTopicsList();
    } catch (err) {
      setError('Could not seed topic to database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Exam Topics
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Select a topic from your Supabase database to configure and start your speed math drill.
        </p>
      </div>

      {/* Database sync error notice if any */}
      {error && (
        <Alert variant="warning" title="Database Notice">
          {error}. Please check your database connection.
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading topics from Supabase...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && topics.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No topics found in Supabase"
          description="The topics table in your database is empty. Click below to initialize Fast Addition & Subtraction or run schema.sql in Supabase SQL editor."
          actionText={seeding ? 'Initializing...' : 'Seed Fast Addition & Subtraction'}
          onAction={handleSeedTopic}
        />
      )}

      {/* Active Topics List */}
      {!loading && topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic) => {
            const generator = getTopicGenerator(topic.id) || getTopicGenerator(topic.name);
            const description =
              generator?.description ||
              'Timed calculation drill designed to improve mental calculation speed and accuracy for competitive exams.';

            return (
              <div
                key={topic.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {topic.category || 'Quantitative Aptitude'}
                    </span>
                    <span className="inline-flex items-center text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Active
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2">{topic.name}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{description}</p>

                  {/* Generator Features */}
                  {generator?.config && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Drill Length:</span>
                        <span className="font-semibold text-slate-700">5 to 100 Questions</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Operations:</span>
                        <span className="font-semibold text-slate-700">Addition, Subtraction, Both</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Technique Styles:</span>
                        <span className="font-semibold text-slate-700">Standard, Near-Base Adjustments</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    to={`/practice?topic=${encodeURIComponent(topic.id)}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Configure & Practice
                    <ArrowRight className="w-4 h-4 ml-1.5" />
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
