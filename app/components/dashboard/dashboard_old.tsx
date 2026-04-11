"use client";

import React, { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from 'react-dom'
import Link from 'next/link'
import "./dashboard.css"
import { supabase } from "../../../lib/supabaseClient";

function ScenarioGraph() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const data = [55, 62, 48, 65, 58, 72, 60, 78, 55, 70, 80, 65, 74, 58, 82]
  const w = 500
  const h = 100
  const min = Math.min(...data) - 5
  const max = Math.max(...data) + 5
  const xStep = w / (data.length - 1)
  const yScale = (v: number) => h - 10 - ((v - min) / (max - min)) * (h - 20)
  const xs = data.map((_, i) => i * xStep)
  const ys = data.map((v) => yScale(v))

  let linePath = `M ${xs[0]},${ys[0]}`
  for (let i = 1; i < data.length; i++) {
    const cpx1 = xs[i - 1] + xStep / 3
    const cpx2 = xs[i] - xStep / 3
    linePath += ` C ${cpx1},${ys[i - 1]} ${cpx2},${ys[i]} ${xs[i]},${ys[i]}`
  }
  const areaPath = `${linePath} L ${xs[data.length - 1]},${h} L ${xs[0]},${h} Z`

  const peakIdx = data.indexOf(Math.max(...data))
  const peakXPct = (xs[peakIdx] / w) * 100
  const peakYPct = (ys[peakIdx] / h) * 100

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full cursor-crosshair"
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const xRatio = (e.clientX - rect.left) / rect.width
          const idx = Math.round(xRatio * (data.length - 1))
          setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="areaGradDash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <filter id="glowDash" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={areaPath} fill="url(#areaGradDash)" />
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glowDash)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* persistent peak */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: `clamp(36px, ${peakXPct}%, calc(100% - 36px))`,
          top: `clamp(28px, ${peakYPct}%, calc(100% - 8px))`,
          transform: 'translate(-50%, -130%)',
        }}
      >
        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-sm">
          <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">Score: {Math.max(...data)}</span>
        </div>
      </div>
    </>
  )
}

function StatCard({
  title,
  value,
  delta,
}: {
  title: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-lg bg-white/80 dark:bg-gray-900/60 p-4 shadow">
      <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div
        className={`mt-1 text-sm ${delta?.startsWith("+") ? "text-green-600" : "text-red-500"}`}
      >
        {delta}
      </div>
      
    </div>
  );
}

function ReadinessScore({
  percent = 0,
  size = 120,
  strokeWidth = 12,
}: {
  percent?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="mt-3 text-2xl font-bold">{percent}%</div>
    </div>
  );
}

function SmallRing({
  percent = 0,
  size = 68,
  stroke = 6,
  label = "",
}: {
  percent?: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="flex flex-col items-center w-20">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          {label}
        </div>
      </div>
      <div className="mt-2 text-sm font-medium">{percent}%</div>
    </div>
  );
}

export default function Dashboard() {
  const [hoverOpen, setHoverOpen] = useState(false)
  const [favOpen, setFavOpen] = useState(false)
  const [showAllRings, setShowAllRings] = useState(false)

  function Calendar() {
    const today = new Date()
    const [current, setCurrent] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
    const [selected, setSelected] = useState<number | null>(null)
    const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null)
    const [anchorFixed, setAnchorFixed] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const addFormRef = useRef<HTMLDivElement | null>(null)

    // interview scheduling state
    const [interviews, setInterviews] = useState<Array<any>>([])
    const [subjectInput, setSubjectInput] = useState("")
    const [difficultyInput, setDifficultyInput] = useState("intermediate")
    const [roundInput, setRoundInput] = useState("")
    const [notesInput, setNotesInput] = useState("")
    const [loadingInterviews, setLoadingInterviews] = useState(false)
    const [showAddFormModal, setShowAddFormModal] = useState(false)

    // month -> map of day number -> interviews for that day
    const [monthInterviewsMap, setMonthInterviewsMap] = useState<Record<number, any[]>>({})

    useEffect(() => {
      function handlePointer(e: PointerEvent) {
        if (!containerRef.current) return
        // close dropdown when clicking anywhere outside the calendar or dropdown
        if (selected != null && anchor) {
          const target = e.target as Node
          const inContainer = containerRef.current.contains(target)
          const inDropdown = dropdownRef.current?.contains(target)
          const inAddModal = addFormRef.current?.contains(target)
          if (!inContainer && !inDropdown && !inAddModal) {
            setSelected(null)
            setAnchor(null)
            setAnchorFixed(false)
          }
        }
      }
      document.addEventListener('pointerdown', handlePointer)
      return () => document.removeEventListener('pointerdown', handlePointer)
    }, [selected, anchor])

    const month = current.getMonth()
    const year = current.getFullYear()

    // compute calendar cells for a 6-week grid (42 cells)
    const firstDay = new Date(year, month, 1).getDay() // 0..6 (Sun..Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    const total = 42
    const cells = Array.from({ length: total }).map((_, i) => {
      const dayIndex = i - firstDay + 1
      if (dayIndex <= 0) {
        // previous month
        const d = prevMonthDays + dayIndex
        return { type: 'prev', day: d }
      } else if (dayIndex > daysInMonth) {
        // next month
        const d = dayIndex - daysInMonth
        return { type: 'next', day: d }
      } else {
        return { type: 'current', day: dayIndex }
      }
    })

    function prevMonth() {
      setCurrent(new Date(year, month - 1, 1))
    }
    function nextMonth() {
      setCurrent(new Date(year, month + 1, 1))
    }

    function handleDateClick(e: React.MouseEvent<HTMLDivElement>, d: number, type: string) {
      const el = e.currentTarget as HTMLDivElement
      // ensure add-modal only opens via the + Add button
      setShowAddFormModal(false)
      console.debug('[calendar] date clicked', { d, type })
      // if clicked a prev/next month cell, switch month then select
      if (type !== 'current') {
        if (type === 'prev') {
          setCurrent(new Date(year, month - 1, 1))
        } else if (type === 'next') {
          setCurrent(new Date(year, month + 1, 1))
        }
        // continue to set selection/anchor so dropdown opens for that date
      }
      const rect = el.getBoundingClientRect()
      const left = rect.left
      const top = rect.bottom
      if (selected === d) {
        setSelected(null)
        setAnchor(null)
        setAnchorFixed(false)
      } else {
        setSelected(d)
        setAnchor({ left, top })
        // always use fixed/portaled dropdown positioned in viewport
        setAnchorFixed(true)
      }
    }

    const fetchInterviewsForDay = useCallback(async (day: number) => {
      try {
        setLoadingInterviews(true)
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (!userId) return setInterviews([])
        // build date for current month/year
        const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        const { data, error } = await supabase.from('user_interviews').select('*').eq('user_id', userId).eq('interview_date', iso).order('created_at', { ascending: false })
        if (error) {
          console.error('Failed to load interviews', error)
          setInterviews([])
          return
        }
        setInterviews(data ?? [])
      } finally {
        setLoadingInterviews(false)
      }
    }, [month, year])

    const fetchInterviewsForMonth = useCallback(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (!userId) return setMonthInterviewsMap({})
        const start = `${year}-${String(month + 1).padStart(2,'0')}-01`
        const end = `${year}-${String(month + 1).padStart(2,'0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2,'0')}`
        const { data, error } = await supabase.from('user_interviews').select('*').eq('user_id', userId).gte('interview_date', start).lte('interview_date', end).order('interview_date', { ascending: true })
        if (error) {
          console.error('Failed to load monthly interviews', error)
          setMonthInterviewsMap({})
          return
        }
        const map: Record<number, any[]> = {};
        ;(data ?? []).forEach((iv: any) => {
          try {
            const day = new Date(iv.interview_date).getDate()
            map[day] = map[day] || []
            map[day].push(iv)
          } catch (e) {
            // ignore parse errors
          }
        })
        console.debug('[calendar] month interviews map', map)
        setMonthInterviewsMap(map)
      } catch (e) {
        console.error(e)
        setMonthInterviewsMap({})
      }
    }, [month, year])

    useEffect(() => {
      if (selected != null) {
        void fetchInterviewsForDay(selected)
      } else {
        setInterviews([])
      }
    }, [selected, fetchInterviewsForDay])

    // load all interviews for the visible month to display markers
    useEffect(() => {
      void fetchInterviewsForMonth()
    }, [fetchInterviewsForMonth])

    async function saveInterviewForDay(day: number) {
      try {
        console.debug('[calendar] saving interview', { day, subjectInput, difficultyInput, roundInput })
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (!userId) throw new Error('Not signed in')
        const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        const payload = {
          user_id: userId,
          interview_date: iso,
          subject: subjectInput,
          difficulty: difficultyInput,
          round: roundInput,
          notes: notesInput
        }
        const { data, error } = await supabase.from('user_interviews').insert(payload).select()
        if (error) {
          console.error('Failed to save interview', error)
          return false
        }
        // refresh list and month map
        await fetchInterviewsForDay(day)
        await fetchInterviewsForMonth()
        // clear form
        setSubjectInput("")
        setDifficultyInput('medium')
        setRoundInput('technical')
        setNotesInput("")
        return true
      } catch (e) {
        console.error(e)
        return false
      }
    }

    async function updateInterviewStatus(id: string | number, status: string) {
      try {
        console.debug('[calendar] updateInterviewStatus', { id, status })
        const { data, error } = await supabase.from('user_interviews').update({ status }).eq('id', id).select()
        if (error) {
          console.error('Failed to update interview status', error)
          return false
        }
        console.debug('[calendar] update result', { data })
        // refresh day and month
        if (selected != null) await fetchInterviewsForDay(selected)
        await fetchInterviewsForMonth()
        return true
      } catch (e) {
        console.error('updateInterviewStatus exception', e)
        return false
      }
    }

    const monthLabel = current.toLocaleString(undefined, { month: 'long', year: 'numeric' })

    return (
      <div ref={containerRef} className="relative rounded-lg border border-white/20 bg-black/60 p-2 sm:p-4 backdrop-blur-md text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/5">◀</button>
            <div className="font-semibold">{monthLabel}</div>
            <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/5">▶</button>
          </div>
          <div className="text-sm opacity-80">Pending</div>
        </div>

        <div className="grid grid-cols-7 gap-0 sm:gap-1 text-xs">
          {['S','M','T','W','T','F','S'].map((d, idx) => (
            <div key={`${d}-${idx}`} className="text-center opacity-70">{d}</div>
          ))}

          {cells.map((cell, idx) => (
            <div key={idx} className="h-6 sm:h-8 flex items-center justify-center">
              <div
                onClick={(e) => handleDateClick(e, cell.day, cell.type)}
                role="button"
                tabIndex={0}
                className={`relative w-5 sm:w-8 h-5 sm:h-8 flex items-center justify-center rounded-full ${cell.type === 'current' ? 'bg-white/5 cursor-pointer' : 'opacity-40'} ${selected === cell.day && cell.type === 'current' ? 'ring-2 ring-emerald-400' : ''}`}
              >
                <div className="text-[10px] sm:text-sm">{cell.day}</div>
                {cell.type === 'current' && (() => {
                  const dayMap = monthInterviewsMap[cell.day] || []
                  const hasScheduled = dayMap.length > 0
                  const hasCompleted = dayMap.some((iv: any) => iv.status === 'completed')
                  const hasMissed = dayMap.some((iv: any) => iv.status === 'missed')
                  if (hasCompleted) {
                    return <div className="absolute -right-2 -top-2 bg-emerald-500 rounded-full w-3 sm:w-5 h-3 sm:h-5 flex items-center justify-center text-[7px] sm:text-[10px]">✓</div>
                  }
                  if (hasMissed) {
                    return <div className="absolute -right-2 -top-2 bg-red-600 rounded-full w-3 sm:w-5 h-3 sm:h-5 flex items-center justify-center text-[7px] sm:text-[10px]">✕</div>
                  }
                  if (hasScheduled) {
                    return <div className="absolute -right-0.5 -top-0.5 bg-emerald-400 rounded-full w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  }
                  return null
                })()}
              </div>
              
            </div>
          ))}
        </div>

        {selected && anchor && (() => {
            const dd = (
              <div
                ref={dropdownRef}
                className={`${anchorFixed ? 'fixed' : 'absolute'} z-50 w-72 sm:w-96 bg-black/80 border border-white/20 rounded-md p-2 sm:p-3 shadow-lg text-sm`}
              >
                <div className="text-xs opacity-80">{selected} {current.toLocaleString(undefined, { month: 'short' })}</div>

                <div className="mt-2 mb-2">
                  <div className="font-semibold mb-1">Scheduled interviews</div>
                  {loadingInterviews ? (
                    <div className="text-xs opacity-70">Loading…</div>
                  ) : interviews.length ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {interviews.map((iv: any) => (
                        <li key={iv.id} className="p-2 rounded bg-black/40 border border-white/10">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium">{iv.subject || 'Untitled'}</div>
                              <div className="text-xs opacity-80">{iv.round} · {iv.difficulty}</div>
                              {iv.notes && <div className="mt-1 text-xs opacity-70">{iv.notes}</div>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {iv.status === 'completed' && <div className="text-xs text-emerald-400">Completed</div>}
                              {iv.status === 'missed' && <div className="text-xs text-red-400">Missed</div>}
                              <div className="flex gap-1">
                                {iv.status !== 'completed' && (
                                  <button onClick={async () => await updateInterviewStatus(iv.id, 'completed')} className="text-xs px-2 py-0.5 rounded bg-emerald-600">Mark complete</button>
                                )}
                                {iv.status !== 'missed' && (
                                  <button onClick={async () => await updateInterviewStatus(iv.id, 'missed')} className="text-xs px-2 py-0.5 rounded bg-red-600">Mark missed</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs opacity-70">No interviews scheduled</div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="font-semibold">Scheduled</div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(ev) => { ev.stopPropagation(); console.debug('[calendar] +Add clicked', { selected }); setShowAddFormModal(true); }} className="px-2 py-1 rounded bg-emerald-600 text-sm">+ Add</button>
                    <button onClick={() => { setSelected(null); setAnchor(null); setAnchorFixed(false); }} className="px-2 py-1 rounded bg-white/10 text-sm">Close</button>
                  </div>
                </div>

                {showAddFormModal && selected && (() => {
                  const modal = (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddFormModal(false)} />
                      <div ref={addFormRef} className="relative w-full max-w-md p-4 bg-black/80 border border-white/20 rounded-md text-white">
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => setShowAddFormModal(false)} className="px-2 py-1 rounded bg-white/10">Back</button>
                          <div className="font-semibold">Add interview — {selected} {current.toLocaleString(undefined, { month: 'short' })}</div>
                          <div />
                        </div>
                        <div>
                          <input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} placeholder="Subject" className="w-full mb-2 rounded px-2 py-1 bg-black/30 border border-white/10" />
                          <div className="flex gap-2 mb-2">
                            <select value={difficultyInput} onChange={(e) => setDifficultyInput(e.target.value)} className="flex-1 rounded px-2 py-1 bg-black/30 border border-white/10">
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                            <input value={roundInput} onChange={(e) => setRoundInput(e.target.value)} placeholder="Round (e.g. technical)" className="flex-1 rounded px-2 py-1 bg-black/30 border border-white/10" />
                          </div>
                          <textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Notes (optional)" className="w-full mb-2 rounded px-2 py-1 bg-black/30 border border-white/10" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddFormModal(false)} className="px-3 py-1 rounded bg-white/10">Cancel</button>
                            <button onClick={async () => { if (selected) { await saveInterviewForDay(selected); setShowAddFormModal(false); } }} className="px-3 py-1 rounded bg-emerald-600">Save</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                  try { return createPortal(modal, document.body) } catch (e) { return modal }
                })()}
              </div>
            )

          if (anchorFixed) {
            try {
              const ddW = 144
              const leftRaw = anchor.left
              // For small screens use full-width with side padding and clamp top
              const topRaw = anchor.top + 6
              if (window.innerWidth < 640) {
                const top = Math.min(Math.max(topRaw, 8), Math.max(8, window.innerHeight - 120))
                return createPortal(React.cloneElement(dd, { style: { left: 8, right: 8, top } }), document.body)
              }
              const maxLeft = Math.max(8, window.innerWidth - ddW - 8)
              const left = Math.min(Math.max(leftRaw, 8), maxLeft)
              const top = topRaw
              return createPortal(React.cloneElement(dd, { style: { left, top } }), document.body)
            } catch (e) {
              return dd
            }
          }

          return React.cloneElement(dd, { style: { left: anchor.left, top: anchor.top + 36 } })
        })()}
      </div>
    )
  }

  const collections = [
    { title: "Frontend", color: "bg-emerald-600" },
    { title: "Backend", color: "bg-sky-600" },
    { title: "Database", color: "bg-violet-600" },
    { title: "DevOps", color: "bg-orange-500" },
    { title: "Security", color: "bg-rose-600" },
    { title: "Data Science", color: "bg-green-700" },
    { title: "System Programming", color: "bg-slate-700" },
    { title: "Algorithms", color: "bg-indigo-600" },
    { title: "Machine Learning", color: "bg-pink-600" },
    { title: "Cloud", color: "bg-cyan-600" },
    { title: "Mobile", color: "bg-yellow-600" },
    { title: "UX/UI", color: "bg-rose-400" },
  ];

  const skills = [
    { name: 'Coding', abbr: 'CO' },
    { name: 'Critical Thinking', abbr: 'CT' },
    { name: 'Communication', abbr: 'CM' },
    { name: 'Quantitative Aptitude', abbr: 'QA' },
    { name: 'Problem Solving', abbr: 'PS' },
    { name: 'System Design', abbr: 'SD' },
    { name: 'Data Analysis', abbr: 'DA' },
    { name: 'Algorithms', abbr: 'AL' },
    { name: 'Machine Learning', abbr: 'ML' },
    { name: 'Cloud', abbr: 'CL' },
    { name: 'Mobile', abbr: 'MB' },
    { name: 'UX', abbr: 'UX' },
  ]

  // sample per-collection progress (same length as collections)
  const [progress, setProgress] = useState<number[]>([72, 30, 55, 20, 90, 45, 60, 12, 78, 34, 56, 18]);

  const [favQuestions, setFavQuestions] = useState<string[]>([
    "What is closure in JavaScript?",
    "Explain normalization in databases.",
    "How does HTTP/2 improve performance?",
    "Design an LRU cache.",
    "Explain the CAP theorem.",
    "What is the difference between TCP and UDP?",
  ]);

  const [thisWeek, setThisWeek] = useState<{ xp?: number; badges?: number; leaderboard_rank?: number; modules_completed?: number }>({ xp: 1250 });
  // load per-user dashboard data from Supabase and update local state (no layout change)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        console.debug('[dashboard] signed-in user id:', userId);
        if (!userId) {
          console.debug('[dashboard] no signed-in user; dashboard row will not be loaded');
          return;
        }

        const { data, error } = await supabase.from('user_dashboards').select('*').eq('user_id', userId).single();
        if (error) {
          console.error('Failed to load dashboard row', error);
          return;
        }
        console.debug('[dashboard] loaded dashboard row:', data);
        if (!mounted) return;

        // update favourite questions
        if (Array.isArray(data.favourite_questions)) setFavQuestions(data.favourite_questions);

        // update this week metrics
        if (data.this_week) {
          const tw = data.this_week;
          setThisWeek({ xp: tw.xp ?? tw?.xp, badges: tw.badges ?? tw?.badges, leaderboard_rank: tw.leaderboard_rank ?? tw?.leaderboard_rank, modules_completed: tw.modules_completed ?? tw?.modules_completed });
        }

        // Prefer explicit readiness_score object for per-skill values (seeded values)
        if (data.readiness_score && typeof data.readiness_score === 'object') {
          try {
            const rs = data.readiness_score;
            const vals = skills.map((s) => {
              if (typeof rs[s.abbr] === 'number') return rs[s.abbr];
              if (typeof rs[s.name] === 'number') return rs[s.name];
              const lc = s.name.toLowerCase();
              if (typeof rs[lc] === 'number') return rs[lc];
              return 0;
            });
            setProgress(vals);
          } catch (e) {
            console.error('Failed to parse readiness_score', e);
          }
        } else if (data.graph_data) {
          // update small progress rings from graph_data if available (fallback)
          const gd = data.graph_data;

          if (gd.subject && typeof gd.subject === 'object') {
            // map by collection title names (prefer exact, then lowercase, then abbreviated)
            const vals = collections.map((c) => {
              const choices = [c.title, c.title.toLowerCase(), c.title.replace(/\W+/g, '').toUpperCase()];
              for (const k of choices) {
                if (gd.subject[k]) {
                  const arr = gd.subject[k];
                  return Array.isArray(arr) ? (arr[arr.length - 1] ?? 0) : (typeof arr === 'number' ? arr : 0);
                }
              }
              return 0;
            });
            setProgress(vals);
          } else if (Array.isArray(gd.monthly)) {
            const latest = gd.monthly[gd.monthly.length - 1] ?? 0;
            setProgress(collections.map(() => latest));
          } else if (Array.isArray(gd.weekly)) {
            const latest = gd.weekly[gd.weekly.length - 1] ?? 0;
            setProgress(collections.map(() => latest));
          }
        }
      } catch (e) {
        console.error('Error loading dashboard data', e);
      }
    }
    load();
    function onFavUpdated(e: any) {
      console.debug('[dashboard] favourites updated event', e?.detail)
      // re-run load to refresh favourites
      void load()
    }
    window.addEventListener('favourites:updated', onFavUpdated)
    return () => { window.removeEventListener('favourites:updated', onFavUpdated); mounted = false }
  }, []);

  function abbreviate(title: string) {
    const map: Record<string, string> = {
      Frontend: "FE",
      Backend: "BE",
      Database: "DB",
      DevOps: "DO",
      Security: "SEC",
      "Data Science": "DS",
      "System Programming": "SP",
      Algorithms: "AL",
      "Machine Learning": "ML",
      Cloud: "CL",
      Mobile: "MB",
      "UX/UI": "UX",
    };
    return (
      map[title] ??
      title
        .split(/\W+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    );
  }

  return (
    <div className="pt-4 px-0 sm:px-0 lg:px-0 pb-6 v-scrollbar-hide">

      

      {/* New 2-column layout below recommended collections (left column smaller) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        <div className="lg:col-span-2 rounded-lg p-4 col-bg flex flex-col items-center">
          <h3 className="mb-4 text-lg font-semibold">Readiness Score</h3>

          {/* small circular progress badges, scrollable */}
          <div className="w-full">
            <div className="-mx-2">
              <div className="flex gap-4 overflow-x-auto px-2 py-2 scrollbar-hide items-end">
                {(showAllRings ? collections : collections.slice(0, 5)).map((c, i) => (
                  <div key={c.title} className="shrink-0 flex flex-col items-center" title={`${skills[i]?.name ?? c.title} (${skills[i]?.abbr ?? abbreviate(c.title)})`}>
                    <SmallRing percent={progress[i] ?? 0} label={skills[i]?.abbr ?? abbreviate(c.title)} />
                  </div>
                ))}

                {collections.length > 5 && (
                  <div className="shrink-0 flex flex-col items-center">
                    <button
                      onClick={() => setShowAllRings(!showAllRings)}
                      aria-label={showAllRings ? 'Show less' : 'Show more'}
                      className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white bg-black/40"
                    >
                      {showAllRings ? '−' : '+'}
                    </button>
                    <div className="mt-2 text-sm font-medium opacity-80">{showAllRings ? 'Less' : 'More'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 w-full grid grid-cols-1 gap-4">
            <div>
                <div className="card-bg border border-white/8 rounded-xl p-4 text-white w-full text-center">
                <div className="text-sm opacity-90">Slaying September Contest</div>
                <div className="mt-4">
                  <button className="px-4 py-2 rounded-md bg-[#19332C]/50 hover:bg-[#19332C]/80 text-white">Continue</button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="w-full rounded-lg p-0 bg-black/60 border border-white/20 text-white">
                <div className="p-3">
                  <Calendar />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 relative rounded-lg p-4 col-bg">
          {/* right column: contest card, expanding interviews panel, and graph */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Two cards placed side-by-side on larger screens */}
              <div className="lg:col-span-1">
                <h4 className="text-xl font-semibold mb-3">This week:</h4>
                <div className="text-base leading-relaxed text-gray-200 dark:text-gray-300">
                    <div className="mb-1">Total: XP points - <span className="font-medium">{thisWeek.xp ?? '—'}</span></div>
                    <div className="mb-1">Badges Earned: <span className="font-medium">{thisWeek.badges ?? '—'}</span></div>
                    <div className="mb-1">Current levels:</div>
                    <div className="mb-1">Leaderboard Rank: <span className="font-medium">{thisWeek.leaderboard_rank ?? '—'}</span></div>
                  </div>
              </div>
              <div
                className="card-bg border border-white/8 rounded-xl p-3 text-white w-full cursor-pointer lg:col-span-2"
                onClick={() => setFavOpen(true)}
              >
                <div className="text-sm opacity-90">Favourite questions</div>
                <div className="mt-3 text-left">
                  <div className="pr-2">
                    <ul className="space-y-2 text-sm">
                      {favQuestions.slice(0, 4).map((q, idx) => (
                        <li key={idx} className="opacity-90">• {q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Calendar removed from right column per design change */}
            </div>

              <div className="card-bg border border-white/8 rounded-2xl p-5 h-96 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-white">Performance Chart</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Score trend in last · 14 days</p>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                <ScenarioGraph />
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Recommended Collections: horizontally scrollable cards (moved below main grid) */}
        <section className="mb-1 mt-6">
          <h2 className="mt-2 mb-2 text-2xl font-semibold">Recommended collections</h2>
          <div>
              <div className="rounded-2xl overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pl-0 pr-1 py-1 scrollbar-hide">
                  {collections.map((c) => (
                    <div key={c.title} className="min-w-[20rem] sm:min-w-[24rem] md:min-w-md lg:min-w-lg shrink-0 recommended-card rounded-xl p-6 text-white group relative transition-all duration-200 overflow-hidden" style={{ minHeight: 220 }}>
                      {/* Main visible content - fades out on hover */}
                      <div className="flex flex-col h-full transition-opacity duration-200 opacity-100 group-hover:opacity-0">
                        <div className="text-sm opacity-90">Collection</div>
                        <div className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold">{c.title}</div>
                        <div className="mt-4 text-sm opacity-90">5 courses · 24 items</div>
                      </div>

                      {/* Hover overlay (actions) - styled via dashboard.css */}
                      <div className="dashboard-collection-overlay">
                        <div className="text-xl font-semibold">{c.title}</div>
                        <div className="text-sm opacity-80 text-center">Explore this collection and start practicing</div>
                        <div className="flex gap-3 mt-2">
                          <Link href={`/collections/${c.title.toLowerCase().replace(/\s+/g, '-')}`} className="px-4 py-2 rounded-md border border-white/30 bg-white/6 hover:bg-white/10">Learn</Link>
                          <Link href={`/collections`} className="px-4 py-2 rounded-md border border-white/30 bg-white/6 hover:bg-white/10">Mock</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {favOpen && (() => {
                const modal = (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={() => setFavOpen(false)} />
                      <div className="relative w-full max-w-2xl p-2">
                        <div className="recommended-card rounded-xl p-4 text-white" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">Favourite questions</div>
                          <button onClick={() => setFavOpen(false)} className="ml-2 px-3 py-1 rounded-md bg-white/10">Close</button>
                        </div>
                        <div className="mt-4 max-h-64 overflow-y-auto">
                          <ul className="space-y-3">
                            {favQuestions.map((q, i) => (
                              <li key={i} className="text-sm opacity-90">{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )
                try {
                  return createPortal(modal, document.body)
                } catch (e) {
                  return modal
                }
              })()}
          </div>
        </section>
      </div>
    )
  }
