import { useEffect, useState } from 'react';
import './aimatch.css';
import AppHeader from '../components/AppHeader';
import { recommendFreelancers, type FreelancerRecommendationItemResponse } from '../api/recommendations';
import { getProjectTypeCodes, getRegionCodes, getAvailableTimeSlotCodes, type CodeLookupResponse } from '../api/codes';
import { getErrorMessage } from '../lib/errors';
import { labelOf } from '../lib/referenceData';

type Step = 'form' | 'loading' | 'results';

const LOAD_STEPS = [
  '프리랜서 목록 조회 중...',
  '조건에 맞는 메이트 필터링 중...',
  'AI 매칭 점수 계산 중...',
  '결과 정렬 중...',
];

const REASON_LABELS: Record<string, string> = {
  PROJECT_TYPE_MATCH: '서비스 유형 일치',
  REGION_MATCH: '지역 일치',
  TIME_SLOT_MATCH: '시간대 가능',
  VERIFIED_FREELANCER: '신원 인증됨',
  HIGH_RATING: '고평점 메이트',
  EXPERIENCED: '활동 경험 풍부',
};

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <svg className="am-score-ring" width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--line-color)" strokeWidth="4" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke="var(--green-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="am-score-arc"
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="42" textAnchor="middle" className="am-score-text">{score}</text>
    </svg>
  );
}

export default function AiMatchPage() {
  const [step, setStep] = useState<Step>('form');
  const [projectTypeCodes, setProjectTypeCodes] = useState<CodeLookupResponse[]>([]);
  const [regionCodes, setRegionCodes] = useState<CodeLookupResponse[]>([]);
  const [timeSlotCodes, setTimeSlotCodes] = useState<CodeLookupResponse[]>([]);
  const [codeMap, setCodeMap] = useState<Map<string, string>>(new Map());
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [results, setResults] = useState<FreelancerRecommendationItemResponse[]>([]);
  const [aiApplied, setAiApplied] = useState(false);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([getProjectTypeCodes(), getRegionCodes(), getAvailableTimeSlotCodes()]).then(
      ([types, regions, slots]) => {
        setProjectTypeCodes(types);
        setRegionCodes(regions.filter((r) => r.regionLevel === 1 || !r.parentRegionCode));
        setTimeSlotCodes(slots);
        const merged = new Map([
          ...types.map((t) => [t.code, t.name] as [string, string]),
          ...regions.map((r) => [r.code, r.name] as [string, string]),
          ...slots.map((s) => [s.code, s.name] as [string, string]),
        ]);
        setCodeMap(merged);
      },
    );
  }, []);

  async function handleStart(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!selectedType || !selectedRegion) return;

    setStep('loading');
    setLoadStep(0);
    setError('');

    for (let i = 0; i < LOAD_STEPS.length; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 450));
      setLoadStep(i + 1);
    }

    try {
      const response = await recommendFreelancers({
        projectTypeCode: selectedType,
        serviceRegionCode: selectedRegion,
        timeSlotCode: selectedTimeSlot || null,
        size: 6,
      });
      setResults(response.recommendations);
      setAiApplied(response.aiApplied);
      setTotalCandidates(response.totalCandidates);
      setStep('results');
    } catch (err) {
      setError(getErrorMessage(err, '매칭 중 오류가 발생했습니다.'));
      setStep('form');
    }
  }

  function handleReset() {
    setStep('form');
    setSelectedType('');
    setSelectedRegion('');
    setSelectedTimeSlot('');
    setResults([]);
    setLoadStep(0);
  }

  const canSubmit = selectedType && selectedRegion;

  return (
    <div className="am-page">
      <AppHeader activePage="freelancers" />
      <main className="am-content">

        {step === 'form' && (
          <>
            <div className="am-page-title">
              <h1>AI 메이트 추천</h1>
              <p>서비스 유형과 지역을 선택하면 조건에 맞는 메이트를 추천해드립니다.</p>
            </div>

            <form onSubmit={handleStart}>
              {projectTypeCodes.length > 0 && (
                <section className="am-section">
                  <div className="am-section-label">서비스 유형 <span style={{ color: '#e07070' }}>*</span></div>
                  <div className="am-service-grid">
                    {projectTypeCodes.map((type) => (
                      <button
                        key={type.code}
                        type="button"
                        className={`am-service-card${selectedType === type.code ? ' selected' : ''}`}
                        onClick={() => setSelectedType((prev) => (prev === type.code ? '' : type.code))}
                      >
                        <span className="am-service-icon">◈</span>
                        <span className="am-service-label">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {regionCodes.length > 0 && (
                <section className="am-section">
                  <div className="am-section-label">활동 지역 <span style={{ color: '#e07070' }}>*</span></div>
                  <div className="am-chip-group">
                    {regionCodes.map((region) => (
                      <button
                        key={region.code}
                        type="button"
                        className={`am-chip${selectedRegion === region.code ? ' selected' : ''}`}
                        onClick={() => setSelectedRegion((prev) => (prev === region.code ? '' : region.code))}
                      >
                        {region.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {timeSlotCodes.length > 0 && (
                <section className="am-section">
                  <div className="am-section-label">선호 시간대 <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(선택)</span></div>
                  <div className="am-chip-group">
                    {timeSlotCodes.map((slot) => (
                      <button
                        key={slot.code}
                        type="button"
                        className={`am-chip${selectedTimeSlot === slot.code ? ' selected' : ''}`}
                        onClick={() => setSelectedTimeSlot((prev) => (prev === slot.code ? '' : slot.code))}
                      >
                        {slot.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {error && (
                <p style={{ color: '#e07070', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</p>
              )}

              <button type="submit" className="am-start-btn" disabled={!canSubmit}>
                메이트 추천 받기
              </button>
            </form>
          </>
        )}

        {step === 'loading' && (
          <div className="am-loading-wrap">
            <div className="am-spinner" />
            <p className="am-loading-title">조건에 맞는 메이트를 찾고 있습니다...</p>
            <ul className="am-step-list">
              {LOAD_STEPS.map((label, idx) => (
                <li
                  key={label}
                  className={`am-step-item ${idx < loadStep ? 'done' : idx === loadStep ? 'active' : 'pending'}`}
                >
                  <span className="am-step-icon">{idx < loadStep ? '✓' : idx === loadStep ? '›' : '·'}</span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'results' && (
          <>
            <div className="am-result-header">
              <div>
                <h2 className="am-result-title">
                  추천 메이트 {results.length}명
                  {aiApplied && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.6rem', color: 'var(--green-accent)', verticalAlign: 'middle' }}>
                      AI 가중치 적용됨
                    </span>
                  )}
                </h2>
                <p className="am-result-subtitle">
                  {labelOf(codeMap, selectedType)} · {labelOf(codeMap, selectedRegion)}
                  {selectedTimeSlot && ` · ${labelOf(codeMap, selectedTimeSlot)}`}
                  {` 기준 전체 후보 ${totalCandidates}명 중 매칭 결과입니다.`}
                </p>
              </div>
              <button type="button" className="am-reset-btn" onClick={handleReset}>
                ← 다시 검색
              </button>
            </div>

            <div className="am-result-list">
              {results.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
                  조건에 맞는 메이트가 없습니다.
                </p>
              ) : (
                results.map((item) => (
                  <article key={item.freelancerProfileId} className="am-result-card">
                    <div className="am-card-top">
                      <ScoreRing score={item.matchScore} />
                      <div className="am-card-info">
                        <div className="am-card-name-row">
                          <span className="am-rank-badge">#{item.rank}</span>
                          <span className="am-card-name">{item.name}</span>
                          {item.verifiedYn && <span className="am-verified-dot">인증됨</span>}
                        </div>
                        <div className="am-badge-row">
                          {item.averageRating != null && (
                            <span className="am-stat-chip">★ {Number(item.averageRating).toFixed(1)}</span>
                          )}
                          {item.activityCount != null && (
                            <span className="am-stat-chip">활동 {item.activityCount}건</span>
                          )}
                          {item.reHireRate > 0 && (
                            <span className="am-stat-chip">재고용 {item.reHireRate}%</span>
                          )}
                          {item.caregiverYn && <span className="am-stat-chip">요양보호사</span>}
                        </div>
                      </div>
                      <div className="am-card-photo-wrap">
                        <div className="am-card-photo-fallback">{item.name[0]}</div>
                      </div>
                    </div>

                    {item.matchReasons.length > 0 && (
                      <div className="am-reasons">
                        {item.matchReasons.map((r) => (
                          <span key={r} className="am-reason-tag">
                            {REASON_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.intro && (
                      <p className="am-result-subtitle" style={{ marginBottom: '1rem' }}>
                        {item.intro}
                      </p>
                    )}

                    <div className="am-card-actions">
                      <a className="am-btn-profile" href={`/freelancers/${item.freelancerProfileId}`}>
                        프로필 보기
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
