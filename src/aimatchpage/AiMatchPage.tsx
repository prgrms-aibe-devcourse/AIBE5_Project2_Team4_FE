import { useState, useEffect } from 'react';
import './aimatch.css';
import AppHeader from '../components/AppHeader';
import { FREELANCERS } from '../store/appFreelancerStore';
import type { Freelancer } from '../store/appFreelancerStore';
import { getUser } from '../store/appAuth';
import { makeConvId, registerConversation, CHAT_OPEN_EVENT } from '../store/chatStore';
import type { Conversation } from '../store/chatStore';
import REGION_DATA_JSON from '../data/regions.json';

interface RegionSelection {
  city: string;
  district: string;
  dong: string;
}

interface MatchForm {
  service: string;
  region: RegionSelection;
  timeSlot: string;
}

interface ScoredFreelancer {
  freelancer: Freelancer;
  score: number;
  matchReasons: string[];
  reHireRate: number;
}

interface RecommendationItem {
  freelancerProfileId: number;
  name: string;
  intro?: string;
  careerDescription?: string;
  verifiedYn: boolean;
  averageRating?: number;
  activityCount?: number;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
  matchScore: number;
  reHireRate: number;
  matchReasons: string[];
}

interface RecommendationResponse {
  aiApplied: boolean;
  scoringMode: string;
  recommendations: RecommendationItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const REGION_DATA = REGION_DATA_JSON as Record<string, Record<string, string[]>>;
const CITIES = Object.keys(REGION_DATA);

const SERVICE_TYPES = [
  { label: '병원 동행', icon: '🏥', code: 'HOSPITAL_COMPANION' },
  { label: '외출 보조', icon: '🚶', code: 'OUTING_ASSISTANCE' },
  { label: '생활 지원', icon: '🏠', code: 'DAILY_LIFE_SUPPORT' },
  { label: '관공서 업무', icon: '📄', code: 'GOVERNMENT_OFFICE' },
];

const TIME_SLOTS = [
  { label: '평일 오전', code: 'MORNING' },
  { label: '평일 오후', code: 'AFTERNOON' },
  { label: '주말 오전', code: 'WEEKEND_MORNING' },
  { label: '주말 오후', code: 'WEEKEND_AFTERNOON' },
];

const LOADING_STEPS = [
  { label: '조건 필터 적용 중...', doneLabel: '조건 필터 완료', delay: 0 },
  { label: 'AI 가중치 분석 중...', doneLabel: 'AI 가중치 분석 완료', delay: 1200 },
  { label: '후보 점수 계산 중...', doneLabel: '후보 매칭 완료', delay: 2500 },
  { label: '최적 순위 결정 중...', doneLabel: '매칭 완료', delay: 3800 },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const EMPTY_REGION: RegionSelection = { city: '', district: '', dong: '' };

function normalizeCity(city: string): string {
  return city.replace('특별시', '').replace('광역시', '').replace('시', '').trim();
}

function matchesRegion(availableRegions: string[], region: RegionSelection): boolean {
  if (!region.city) return false;
  const cityShort = normalizeCity(region.city);
  return availableRegions.some(r => {
    if (!region.district) return r.includes(cityShort);
    return r.includes(cityShort) || r.includes(region.district);
  });
}

function matchesTime(availableHours: string, timeSlot: string): boolean {
  if (availableHours.includes('주 7일')) return true;
  if (timeSlot.startsWith('평일') && (availableHours.includes('평일') || availableHours.includes('주중'))) return true;
  if (timeSlot.startsWith('주말') && availableHours.includes('주말')) return true;
  return false;
}

function regionLabel(region: RegionSelection): string {
  const parts = [region.district];
  if (region.dong && region.dong !== '전체') parts.push(region.dong);
  return parts.filter(Boolean).join(' ');
}

function scoreFreelancer(f: Freelancer, form: MatchForm): ScoredFreelancer {
  const ratingScore = f.rating * 12;
  const verifiedScore = f.verified ? 15 : 0;
  const skillScore = Math.min(f.skills.filter(s => s === form.service).length * 5, 15);
  const regionScore = matchesRegion(f.availableRegions, form.region) ? 10 : 0;
  const timeScore = matchesTime(f.availableHours, form.timeSlot) ? 5 : 0;
  const expScore = f.projectCount >= 30 ? 5 : f.projectCount >= 15 ? 3 : 1;

  const raw = ratingScore + verifiedScore + skillScore + regionScore + timeScore + expScore;
  const score = Math.min(Math.round((raw / 110) * 100), 100);

  const reasons: string[] = [];
  if (regionScore > 0) reasons.push(`${regionLabel(form.region) || form.region.city} 활동`);
  if (skillScore > 0) reasons.push(`${form.service} 전문가`);
  if (f.rating >= 4.9) reasons.push(`평점 ${f.rating.toFixed(1)}`);
  if (f.verified) reasons.push('신원 인증');
  if (f.projectCount >= 30) reasons.push(`${f.projectCount}건 경험`);

  const reHireRate = Math.min(Math.round(60 + (f.reviewCount / Math.max(f.projectCount, 1)) * 40), 97);
  return { freelancer: f, score, matchReasons: reasons, reHireRate };
}

function rankFreelancers(form: MatchForm): ScoredFreelancer[] {
  return [...FREELANCERS].map(f => scoreFreelancer(f, form)).sort((a, b) => b.score - a.score);
}

async function rankFreelancersWithApi(form: MatchForm): Promise<ScoredFreelancer[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/recommendations/freelancers/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectTypeCode: projectTypeCodeOf(form.service),
        serviceRegionCode: regionCodeOf(form.region),
        timeSlotCode: timeSlotCodeOf(form.timeSlot),
        size: 5,
      }),
    });

    if (!response.ok) throw new Error(`Recommendation request failed: ${response.status}`);

    const envelope = await response.json() as ApiResponse<RecommendationResponse>;
    if (!envelope.success || !envelope.data?.recommendations) throw new Error('Invalid recommendation response');

    return envelope.data.recommendations.map(toScoredFreelancer);
  } catch {
    return rankFreelancers(form);
  }
}

function projectTypeCodeOf(service: string): string {
  return SERVICE_TYPES.find(item => item.label === service)?.code ?? SERVICE_TYPES[0].code;
}

function timeSlotCodeOf(timeSlot: string): string {
  return TIME_SLOTS.find(item => item.label === timeSlot)?.code ?? TIME_SLOTS[0].code;
}

function regionCodeOf(region: RegionSelection): string {
  const joined = [region.city, region.district, region.dong].filter(Boolean).join(' ');
  if (joined.includes('강남')) return 'SEOUL_GANGNAM';
  return 'SEOUL_GANGNAM';
}

function toScoredFreelancer(item: RecommendationItem): ScoredFreelancer {
  const fallback = FREELANCERS.find(f => f.id === item.freelancerProfileId);
  const freelancer: Freelancer = fallback ?? {
    id: item.freelancerProfileId,
    name: item.name,
    skills: item.projectTypeCodes,
    bio: item.intro || item.careerDescription || '',
    verified: item.verifiedYn,
    rating: item.averageRating ?? 0,
    reviewCount: 0,
    projectCount: item.activityCount ?? 0,
    availableHours: item.availableTimeSlotCodes.join(', '),
    availableRegions: item.activityRegionCodes,
    reviews: [],
  };

  return {
    freelancer,
    score: item.matchScore,
    matchReasons: item.matchReasons,
    reHireRate: item.reHireRate,
  };
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="am-score-ring" width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--line-color)" strokeWidth="5" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="var(--green-accent)"
        strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform="rotate(-90 34 34)"
        className="am-score-arc"
      />
      <text x="34" y="36" textAnchor="middle" className="am-score-text">{score}</text>
      <text x="34" y="48" textAnchor="middle" className="am-score-pct">%</text>
    </svg>
  );
}

function RegionSelector({ value, onChange }: { value: RegionSelection; onChange: (r: RegionSelection) => void }) {
  const districts = value.city ? Object.keys(REGION_DATA[value.city] ?? {}) : [];
  const dongs = value.district ? REGION_DATA[value.city]?.[value.district] ?? [] : [];

  return (
    <div className="am-region-selector">
      <div className="am-region-level">
        <div className="am-region-level-label">시/도</div>
        <div className="am-chip-group">
          {CITIES.map(city => (
            <button key={city} className={`am-chip ${value.city === city ? 'selected' : ''}`} onClick={() => onChange({ city, district: '', dong: '' })}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {value.city && (
        <div className="am-region-level">
          <div className="am-region-level-label">시/군/구</div>
          <div className="am-chip-group">
            {districts.map(district => (
              <button key={district} className={`am-chip ${value.district === district ? 'selected' : ''}`} onClick={() => onChange({ ...value, district, dong: '' })}>
                {district}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.district && dongs.length > 0 && (
        <div className="am-region-level">
          <div className="am-region-level-label">읍/면/동</div>
          <div className="am-chip-group">
            <button className={`am-chip ${value.dong === '전체' || value.dong === '' ? 'selected' : ''}`} onClick={() => onChange({ ...value, dong: '전체' })}>
              전체
            </button>
            {dongs.map(dong => (
              <button key={dong} className={`am-chip ${value.dong === dong ? 'selected' : ''}`} onClick={() => onChange({ ...value, dong })}>
                {dong}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiMatchPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<MatchForm>({ service: '', region: EMPTY_REGION, timeSlot: '' });
  const [results, setResults] = useState<ScoredFreelancer[]>([]);
  const [loadingIdx, setLoadingIdx] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const user = getUser();

  useEffect(() => {
    if (step !== 2) return;
    setLoadingIdx(0);
    setDoneSteps(new Set());
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => setLoadingIdx(i), s.delay));
      const markDoneAt = LOADING_STEPS[i + 1]?.delay ?? 4300;
      timers.push(setTimeout(() => setDoneSteps(prev => new Set([...prev, i])), markDoneAt - 80));
    });
    timers.push(setTimeout(() => {
      void rankFreelancersWithApi(form).then(nextResults => {
        setResults(nextResults);
        setStep(3);
      });
    }, 4500));
    return () => timers.forEach(clearTimeout);
  }, [step, form]);

  const canStart = !!(form.service && form.region.city && form.region.district && form.timeSlot);

  function handleReset() {
    setStep(1);
    setForm({ service: '', region: EMPTY_REGION, timeSlot: '' });
    setDoneSteps(new Set());
    setLoadingIdx(-1);
  }

  function handleStartChat(f: Freelancer) {
    if (!user) return;
    const conv: Conversation = {
      id: makeConvId(user.email, f.id),
      userEmail: user.email,
      userName: user.name,
      freelancerId: f.id,
      freelancerName: f.name,
      freelancerEmail: f.accountEmail ?? '',
    };
    registerConversation(conv);
    window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: conv }));
  }

  const selectedRegionText = [
    form.region.city,
    form.region.district,
    form.region.dong && form.region.dong !== '전체' ? form.region.dong : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="am-page">
      <AppHeader activePage="freelancers" />
      <main className="am-content">
        {step === 1 && (
          <>
            <div className="am-page-title">
              <h1>AI 매칭</h1>
              <p>조건을 입력하면 AI 가중치 기반으로 가장 적합한 메이트를 추천합니다.</p>
            </div>

            <div className="am-section">
              <div className="am-section-label">어떤 서비스가 필요하신가요?</div>
              <div className="am-service-grid">
                {SERVICE_TYPES.map(s => (
                  <button key={s.label} className={`am-service-card ${form.service === s.label ? 'selected' : ''}`} onClick={() => setForm(f => ({ ...f, service: s.label }))}>
                    <span className="am-service-icon">{s.icon}</span>
                    <span className="am-service-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="am-section">
              <div className="am-section-label">
                어느 지역에서 활동하는 메이트를 원하시나요?
                {form.region.district && <span className="am-region-breadcrumb">{selectedRegionText}</span>}
              </div>
              <RegionSelector value={form.region} onChange={r => setForm(f => ({ ...f, region: r }))} />
            </div>

            <div className="am-section">
              <div className="am-section-label">선호하는 시간대를 선택해주세요.</div>
              <div className="am-chip-group">
                {TIME_SLOTS.map(t => (
                  <button key={t.label} className={`am-chip ${form.timeSlot === t.label ? 'selected' : ''}`} onClick={() => setForm(f => ({ ...f, timeSlot: t.label }))}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="am-start-btn" onClick={() => setStep(2)} disabled={!canStart}>AI 매칭 시작</button>
          </>
        )}

        {step === 2 && (
          <div className="am-loading-wrap">
            <div className="am-spinner" />
            <p className="am-loading-title">AI가 최적의 메이트를 찾고 있습니다</p>
            <ul className="am-step-list">
              {LOADING_STEPS.map((s, i) => {
                const isDone = doneSteps.has(i);
                const isActive = loadingIdx === i && !isDone;
                return (
                  <li key={i} className={`am-step-item ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                    <span className="am-step-icon">{isDone ? '✓' : isActive ? '•' : '○'}</span>
                    <span>{isDone ? s.doneLabel : s.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="am-result-header">
              <div>
                <h2 className="am-result-title">매칭 결과</h2>
                <p className="am-result-subtitle">{results.length}명 분석 완료 · {form.service} · {selectedRegionText} · {form.timeSlot}</p>
              </div>
              <button className="am-reset-btn" onClick={handleReset}>다시 검색</button>
            </div>

            <div className="am-result-list">
              {results.map((r, rank) => (
                <div key={r.freelancer.id} className="am-result-card">
                  <div className="am-card-top">
                    <ScoreRing score={r.score} />
                    <div className="am-card-photo-wrap">
                      {r.freelancer.photo
                        ? <img src={r.freelancer.photo} alt={r.freelancer.name} className="am-card-photo" loading="lazy" />
                        : <div className="am-card-photo-fallback">{r.freelancer.name[0]}</div>
                      }
                    </div>
                    <div className="am-card-info">
                      <div className="am-card-name-row">
                        {rank === 0 && <span className="am-rank-badge">AI 추천</span>}
                        <span className="am-card-name">{r.freelancer.name}</span>
                        {r.freelancer.verified && <span className="am-verified-dot">인증</span>}
                      </div>
                      <div className="am-badge-row">
                        <span className="am-stat-chip">재고용률 {r.reHireRate}%</span>
                        <span className="am-stat-chip">완료 {r.freelancer.projectCount}건</span>
                        <span className="am-stat-chip">★ {r.freelancer.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {r.matchReasons.length > 0 && (
                    <div className="am-reasons">
                      {r.matchReasons.map(reason => <span key={reason} className="am-reason-tag">{reason}</span>)}
                    </div>
                  )}

                  <div className="am-card-actions">
                    {user?.role === 'ROLE_USER' && <button className="am-btn-chat" onClick={() => handleStartChat(r.freelancer)}>채팅하기</button>}
                    <button className="am-btn-profile" onClick={() => window.location.href = `/freelancers/${r.freelancer.id}`}>프로필 보기</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
