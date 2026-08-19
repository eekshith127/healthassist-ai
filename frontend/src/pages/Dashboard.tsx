import React from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  CreditCard,
  UserCheck,
  Heart,
  Activity,
  Droplets,
  Moon,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Server,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useHealthCheck } from '../hooks/useHealthCheck'

export const Dashboard: React.FC = () => {
  const { health, isLoading, isError, errorMessage } = useHealthCheck(10000)

  const quickStats = [
    {
      title: 'Resting Heart Rate',
      value: '72',
      unit: 'bpm',
      status: 'Normal range',
      icon: Heart,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    },
    {
      title: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'Optimal',
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Blood Oxygen (SpO2)',
      value: '98',
      unit: '%',
      status: 'Healthy',
      icon: Droplets,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    },
    {
      title: 'Sleep Duration',
      value: '7.8',
      unit: 'hrs',
      status: '+45m vs avg',
      icon: Moon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>AI-Assisted Telemedicine Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, John Doe 👋
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              Your health vitals are stable. How are you feeling today? You can start a clinical AI assessment or review your medical summary anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/assessment">
              <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-md font-semibold gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-700" />
                <span>Start AI Triage</span>
              </Button>
            </Link>
            <Link to="/health-card">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Health Card</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Backend Integration Live Status Card */}
      <Card className="border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isLoading
                ? 'bg-slate-100 text-slate-500'
                : isError
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                  FastAPI Backend Health Status
                </h2>
                {isLoading ? (
                  <Badge variant="secondary">Connecting...</Badge>
                ) : isError ? (
                  <Badge variant="destructive">Disconnected</Badge>
                ) : (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Connected (status: ok)</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isLoading && 'Testing communication with endpoint GET /api/health...'}
                {isError && `Failed to reach backend: ${errorMessage}. Ensure FastAPI server is running.`}
                {!isLoading && !isError && health && (
                  <span>
                    Endpoint <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px]">/api/health</code> operational • Database: <span className="font-semibold capitalize text-emerald-600">{health.database || 'connected'}</span> • Service: {health.service}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border text-[11px]">
              GET /api/health
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Vitals Summary Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span>Real-time Health Indicators</span>
          </h2>
          <Link to="/health-profile" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
            <span>Manage Profile</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{stat.title}</span>
                    <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {stat.value}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{stat.unit}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{stat.status}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Telemedicine Quick Actions</CardTitle>
              <CardDescription>Direct navigation to core clinical workflows</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/assessment"
                className="group p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left"
              >
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600">
                  New AI Assessment
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Intelligent symptom check with multi-LLM consensus verification.
                </p>
              </Link>

              <Link
                to="/providers"
                className="group p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-left"
              >
                <div className="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600">
                  Find Doctor
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Connect with licensed telehealth specialists and clinics.
                </p>
              </Link>

              <Link
                to="/health-card"
                className="group p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left"
              >
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600">
                  Emergency Card
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Access digital emergency QR ID, allergies, and blood group.
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Consultation History Snapshot */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Triage History</CardTitle>
                <CardDescription>Summary of recent symptom evaluations</CardDescription>
              </div>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Mild Seasonal Allergy Triage
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Evaluated on Aug 18, 2026 • Non-urgent care recommended
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px]">98% Consensus</Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Post-Exercise Muscular Strain
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Evaluated on Aug 14, 2026 • Self-care protocol completed
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">Resolved</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Upcoming Telehealth Appointment */}
          <Card className="border-teal-200/80 dark:border-teal-900/50 bg-gradient-to-b from-teal-50/40 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming Tele-Consult</CardTitle>
                <Badge variant="warning">Tomorrow</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  SJ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Sarah Jenkins</div>
                  <div className="text-[11px] text-slate-500">Family Medicine • 10:30 AM EST</div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-[11px] text-slate-500">Meeting Link</div>
                <div className="text-emerald-600 font-mono text-[11px] truncate">https://healthassist.care/tele/v-8492</div>
              </div>

              <Link to="/providers" className="block">
                <Button variant="outline" className="w-full text-xs">
                  Manage Appointments
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Clinical Architecture Safety Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Safety & Consensus Guard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                HealthAssist employs a multi-tiered verification pipeline:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Real-time red-flag clinical emergency screening</li>
                <li>Multi-LLM agreement consensus scoring</li>
                <li>Seamless direct handoff to licensed physicians</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
