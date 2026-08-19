import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Clock, Download, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react'

export const History: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'triage' | 'consult'>('all')

  const historyItems = [
    {
      id: 'HA-2026-0818',
      type: 'triage',
      title: 'Seasonal Allergy & Mild Sinus Congestion',
      date: 'Aug 18, 2026 • 09:14 AM',
      triageLevel: 'Non-Urgent',
      consensusScore: '98.4%',
      status: 'Resolved',
      doctor: 'Automated AI Consensus',
    },
    {
      id: 'HA-2026-0814',
      type: 'triage',
      title: 'Post-Workout Muscular Spasm (Lumbar)',
      date: 'Aug 14, 2026 • 06:45 PM',
      triageLevel: 'Self-Care',
      consensusScore: '96.2%',
      status: 'Resolved',
      doctor: 'Automated AI Consensus',
    },
    {
      id: 'HA-2026-0722',
      type: 'consult',
      title: 'Routine Telehealth Health Review',
      date: 'Jul 22, 2026 • 11:00 AM',
      triageLevel: 'Routine Checkup',
      consensusScore: 'N/A',
      status: 'Completed',
      doctor: 'Dr. Sarah Jenkins (Family Medicine)',
    },
    {
      id: 'HA-2026-0610',
      type: 'triage',
      title: 'Mild Dermatitis / Skin Rash Evaluation',
      date: 'Jun 10, 2026 • 02:30 PM',
      triageLevel: 'Non-Urgent',
      consensusScore: '94.8%',
      status: 'Completed',
      doctor: 'Dr. Marcus Chen (Dermatology)',
    },
  ]

  const filteredItems = historyItems.filter((item) => {
    if (filter === 'all') return true
    return item.type === filter
  })

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-600" />
            <span>Consultation & Assessment History</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete archive of your AI triage evaluations, doctor consultations, and clinical summaries.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border w-fit">
          {(['all', 'triage', 'consult'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Records' : tab === 'triage' ? 'AI Triage' : 'Doctor Consults'}
            </button>
          ))}
        </div>
      </div>

      {/* History Timeline Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    item.type === 'triage'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  }`}
                >
                  <Stethoscope className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <Badge variant={item.triageLevel === 'Emergency' ? 'destructive' : 'default'} className="text-[10px]">
                      {item.triageLevel}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{item.id}</span>
                    <span>•</span>
                    <span>Provider: <strong>{item.doctor}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                {item.consensusScore !== 'N/A' && (
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-medium">Consensus</div>
                    <div className="text-xs font-bold text-emerald-600">{item.consensusScore}</div>
                  </div>
                )}

                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Report</span>
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
