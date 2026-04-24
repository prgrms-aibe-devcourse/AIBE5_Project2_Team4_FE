import { useEffect, useState, type FormEvent } from 'react';
import './announcement.css';
import AppHeader from '../components/AppHeader';
import { getUser } from '../store/appAuth';
import { canSendAnnouncement, effectiveNoticeRole } from '../store/accessControl';
import {
  createAdminNotice,
  deleteAdminNotice,
  publishAdminNotice,
  updateAdminNotice,
  type AdminNoticeResponse,
} from '../api/admin';
import { getNotice, getNotices, type NoticeDetailResponse, type NoticeSummaryResponse } from '../api/notices';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/referenceData';

// ─── 대상 타입 ─────────────────────────────────────────────
type NoticeTarget = 'ALL' | 'ROLE_USER' | 'ROLE_FREELANCER';

const TARGET_LABEL: Record<NoticeTarget, string> = {
  ALL: '전체',
  ROLE_USER: '일반회원',
  ROLE_FREELANCER: '프리랜서',
};

const TITLE_PREFIX: Record<Exclude<NoticeTarget, 'ALL'>, string> = {
  ROLE_FREELANCER: '[FR]',
  ROLE_USER: '[USR]',
};

function encodeTitle(title: string, target: NoticeTarget): string {
  if (target === 'ALL') return title;
  return `${TITLE_PREFIX[target]}${title}`;
}

function decodeTitle(rawTitle: string): { title: string; target: NoticeTarget } {
  if (rawTitle.startsWith('[FR]')) return { title: rawTitle.slice(4), target: 'ROLE_FREELANCER' };
  if (rawTitle.startsWith('[USR]')) return { title: rawTitle.slice(5), target: 'ROLE_USER' };
  return { title: rawTitle, target: 'ALL' };
}

function isVisibleToUser(rawTitle: string, userRole: string | null | undefined): boolean {
  const { target } = decodeTitle(rawTitle);
  if (target === 'ALL') return true;
  return target === userRole;
}

// ─── URL helpers ────────────────────────────────────────────
function readNoticeId(): number | null {
  const raw = new URLSearchParams(window.location.search).get('noticeId');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function updateNoticeQuery(noticeId: number | null): void {
  const nextUrl = new URL(window.location.href);
  if (noticeId == null) {
    nextUrl.searchParams.delete('noticeId');
  } else {
    nextUrl.searchParams.set('noticeId', String(noticeId));
  }
  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

// ─── 대상 배지 CSS ──────────────────────────────────────────
const TARGET_BADGE_CLASS: Record<NoticeTarget, string> = {
  ALL: 'ann-type-badge--general',
  ROLE_USER: 'ann-type-badge--user',
  ROLE_FREELANCER: 'ann-type-badge--freelancer',
};

export default function AnnouncementPage() {
  const user = getUser();
  const isAdmin = canSendAnnouncement(user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [publishError, setPublishError] = useState('');
  const [notices, setNotices] = useState<NoticeSummaryResponse[]>([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(() => readNoticeId());
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draftNotice, setDraftNotice] = useState<AdminNoticeResponse | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [editingNoticeTitle, setEditingNoticeTitle] = useState('');
  const [editingNoticeContent, setEditingNoticeContent] = useState('');
  const [editingTarget, setEditingTarget] = useState<NoticeTarget>('ALL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<NoticeTarget>('ALL');
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 비관리자에게 보여줄 필터링된 목록
  const visibleNotices = isAdmin
    ? notices
    : notices.filter((n) => isVisibleToUser(n.title, effectiveNoticeRole(user)));

  useEffect(() => {
    const syncNoticeFromLocation = () => { setSelectedNoticeId(readNoticeId()); };
    window.addEventListener('popstate', syncNoticeFromLocation);
    return () => window.removeEventListener('popstate', syncNoticeFromLocation);
  }, []);

  useEffect(() => {
    const loadNotices = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getNotices({ page: 0, size: 50 });
        setNotices(response.content);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '공지 목록을 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };
    void loadNotices();
  }, []);

  useEffect(() => {
    if (!selectedNoticeId) {
      setSelectedNotice(null);
      updateNoticeQuery(null);
      return;
    }
    const loadNotice = async () => {
      setDetailLoading(true);
      setPublishError('');
      try {
        const response = await getNotice(selectedNoticeId);
        if (!isAdmin && !isVisibleToUser(response.title, effectiveNoticeRole(user))) {
          setSelectedNoticeId(null);
          updateNoticeQuery(null);
          return;
        }
        setSelectedNotice(response);
        updateNoticeQuery(selectedNoticeId);
      } catch (caughtError) {
        setPublishError(getErrorMessage(caughtError, '공지 상세를 불러오지 못했습니다.'));
      } finally {
        setDetailLoading(false);
      }
    };
    void loadNotice();
  }, [selectedNoticeId]);

  useEffect(() => {
    if (!selectedNotice || editingNoticeId !== selectedNotice.noticeId) return;
    const { title: decoded, target } = decodeTitle(selectedNotice.title);
    setEditingNoticeTitle(decoded);
    setEditingNoticeContent(selectedNotice.content);
    setEditingTarget(target);
  }, [editingNoticeId, selectedNotice]);

  function beginEditNotice(noticeId: number, rawTitle: string, noticeContent: string): void {
    const { title: decoded, target } = decodeTitle(rawTitle);
    setEditingNoticeId(noticeId);
    setEditingNoticeTitle(decoded);
    setEditingNoticeContent(noticeContent);
    setEditingTarget(target);
    setPublishError('');
    setSubmitMessage('');
  }

  function cancelEditNotice(): void {
    setEditingNoticeId(null);
    setEditingNoticeTitle('');
    setEditingNoticeContent('');
    setEditingTarget('ALL');
  }

  async function refreshNotices(selectNoticeId?: number | null): Promise<void> {
    const response = await getNotices({ page: 0, size: 50 });
    setNotices(response.content);
    if (selectNoticeId != null) {
      setSelectedNoticeId(selectNoticeId);
      return;
    }
    if (response.content.length > 0 && !selectedNoticeId) {
      setSelectedNoticeId(response.content[0].noticeId);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;
    if (!title.trim() || !content.trim()) {
      setSubmitMessage('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');
    setPublishError('');

    try {
      const created = await createAdminNotice({
        title: encodeTitle(title.trim(), targetRole),
        content: content.trim(),
        publishNow,
      });

      setTitle('');
      setContent('');
      setTargetRole('ALL');

      if (created.publishedYn) {
        setDraftNotice(null);
        setSubmitMessage('공지가 즉시 발행되었습니다.');
        await refreshNotices(created.noticeId);
      } else {
        setDraftNotice(created);
        setSubmitMessage('공지 초안을 생성했습니다. 필요하면 바로 발행할 수 있습니다.');
      }
    } catch (caughtError) {
      setSubmitMessage(getErrorMessage(caughtError, '공지 저장에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateNotice() {
    if (!editingNoticeId) return;
    if (!editingNoticeTitle.trim() || !editingNoticeContent.trim()) {
      setPublishError('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setPublishError('');
    setSubmitMessage('');

    try {
      const encodedTitle = encodeTitle(editingNoticeTitle.trim(), editingTarget);
      const updated = await updateAdminNotice(editingNoticeId, {
        title: encodedTitle,
        content: editingNoticeContent.trim(),
      });

      setDraftNotice((current) => (current?.noticeId === updated.noticeId ? updated : current));
      setSelectedNotice((current) => (current?.noticeId === updated.noticeId
        ? { ...current, title: updated.title, content: updated.content }
        : current));

      if (selectedNoticeId === updated.noticeId) {
        await refreshNotices(updated.noticeId);
      } else {
        await refreshNotices();
      }

      setSubmitMessage('공지를 수정했습니다.');
      cancelEditNotice();
    } catch (caughtError) {
      setPublishError(getErrorMessage(caughtError, '공지 수정에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNotice(noticeId: number): Promise<void> {
    if (!window.confirm('이 공지를 삭제할까요? 삭제 후에는 복구할 수 없습니다.')) return;

    setSubmitting(true);
    setPublishError('');
    setSubmitMessage('');

    try {
      await deleteAdminNotice(noticeId);
      cancelEditNotice();
      setDraftNotice((current) => (current?.noticeId === noticeId ? null : current));
      setSelectedNotice((current) => (current?.noticeId === noticeId ? null : current));
      setSelectedNoticeId((current) => (current === noticeId ? null : current));
      updateNoticeQuery(null);
      await refreshNotices();
      setSubmitMessage('공지 삭제가 완료되었습니다.');
    } catch (caughtError) {
      setPublishError(getErrorMessage(caughtError, '공지 삭제에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishDraft() {
    if (!draftNotice) return;
    setSubmitting(true);
    setPublishError('');
    try {
      const published = await publishAdminNotice(draftNotice.noticeId);
      setDraftNotice(null);
      setSubmitMessage('초안 공지를 발행했습니다.');
      await refreshNotices(published.noticeId);
    } catch (caughtError) {
      setPublishError(getErrorMessage(caughtError, '공지 발행에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ann-page">
      <AppHeader activePage="announcement" />

      <main className="ann-content">
        <div className="ann-page-head">
          <p className="ann-page-eyebrow">Notice Board</p>
          <h1 className="ann-page-title">공지사항</h1>
          <p className="ann-page-sub">
            {isAdmin
              ? '공지를 작성하고 대상(전체/일반회원/프리랜서)을 지정해 발행할 수 있습니다.'
              : '공개 공지는 누구나 볼 수 있고, 관리자만 새 공지를 작성하고 발행할 수 있습니다.'}
          </p>
        </div>

        {error && <p className="ann-feedback ann-feedback--error">{error}</p>}

        <section className="ann-card">
          <h2 className="ann-card-title">공지 목록</h2>
          {loading ? (
            <p className="ann-empty">목록을 불러오는 중입니다.</p>
          ) : visibleNotices.length === 0 ? (
            <p className="ann-empty">등록된 공지가 없습니다.</p>
          ) : (
            <ul className="ann-history-list">
              {visibleNotices.map((notice) => {
                const { title: displayTitle, target } = decodeTitle(notice.title);
                return (
                  <li key={notice.noticeId} className="ann-history-item">
                    <button
                      type="button"
                      className="ann-history-button"
                      onClick={() => {
                        cancelEditNotice();
                        setSelectedNoticeId(notice.noticeId);
                      }}
                    >
                      <div className="ann-history-top">
                        <span className={`ann-type-badge ${TARGET_BADGE_CLASS[target]}`}>
                          {TARGET_LABEL[target]}
                        </span>
                        <span className="ann-history-date">{formatDateTime(notice.publishedAt)}</span>
                      </div>
                      <div className="ann-history-title">{displayTitle}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {selectedNoticeId && (
          <div className="ann-modal-backdrop" onClick={() => { cancelEditNotice(); setSelectedNoticeId(null); }}>
            <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ann-modal-close"
                onClick={() => { cancelEditNotice(); setSelectedNoticeId(null); }}
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {detailLoading ? (
                <p className="ann-empty">불러오는 중입니다...</p>
              ) : selectedNotice ? (
                editingNoticeId === selectedNotice.noticeId ? (
                  // ─── 편집 폼 ───────────────────────────────
                  <div className="ann-admin-form ann-admin-form--edit">
                    <div className="ann-field">
                      <label>대상</label>
                      <div className="ann-target-selector">
                        {(['ALL', 'ROLE_USER', 'ROLE_FREELANCER'] as NoticeTarget[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`ann-target-btn${editingTarget === t ? ' active' : ''}`}
                            onClick={() => setEditingTarget(t)}
                          >
                            {TARGET_LABEL[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ann-field">
                      <label htmlFor="edit-notice-title">제목</label>
                      <input
                        id="edit-notice-title"
                        className="ann-input"
                        type="text"
                        value={editingNoticeTitle}
                        onChange={(event) => setEditingNoticeTitle(event.target.value)}
                        placeholder="공지 제목을 입력하세요"
                        required
                      />
                    </div>
                    <div className="ann-field">
                      <label htmlFor="edit-notice-content">내용</label>
                      <textarea
                        id="edit-notice-content"
                        className="ann-textarea"
                        rows={8}
                        value={editingNoticeContent}
                        onChange={(event) => setEditingNoticeContent(event.target.value)}
                        placeholder="공지 내용을 입력하세요"
                        required
                      />
                    </div>
                    <div className="ann-submit-row">
                      <button
                        type="button"
                        className="ann-submit-btn"
                        onClick={() => void handleUpdateNotice()}
                        disabled={submitting}
                      >
                        {submitting ? '처리 중...' : '수정 저장'}
                      </button>
                      <button
                        type="button"
                        className="ann-cancel-btn"
                        onClick={cancelEditNotice}
                        disabled={submitting}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="ann-delete-btn"
                        onClick={() => void handleDeleteNotice(editingNoticeId)}
                        disabled={submitting}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  // ─── 공지 상세 ─────────────────────────────
                  <article className="ann-detail">
                    {(() => {
                      const { title: displayTitle, target } = decodeTitle(selectedNotice.title);
                      return (
                        <>
                          <div className="ann-history-top">
                            <span className={`ann-type-badge ${TARGET_BADGE_CLASS[target]}`}>
                              {TARGET_LABEL[target]}
                            </span>
                            <span className="ann-history-date">{formatDateTime(selectedNotice.publishedAt)}</span>
                          </div>
                          <h3 className="ann-detail-title">{displayTitle}</h3>
                        </>
                      );
                    })()}
                    <p className="ann-detail-body">{selectedNotice.content}</p>
                    {isAdmin && (
                      <div className="ann-modal-actions">
                        <button
                          type="button"
                          className="ann-submit-btn"
                          onClick={() => beginEditNotice(selectedNotice.noticeId, selectedNotice.title, selectedNotice.content)}
                          disabled={submitting}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="ann-delete-btn"
                          onClick={() => void handleDeleteNotice(selectedNotice.noticeId)}
                          disabled={submitting}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </article>
                )
              ) : (
                <p className="ann-empty">공지를 불러오지 못했습니다.</p>
              )}
              {publishError && <p className="ann-feedback ann-feedback--error">{publishError}</p>}
            </div>
          </div>
        )}

        {isAdmin && (
          <section className="ann-card ann-admin-card">
            <h2 className="ann-card-title">관리자 공지 작성</h2>
            <form onSubmit={handleSubmit} className="ann-admin-form">
              <div className="ann-field">
                <label>발송 대상</label>
                <div className="ann-target-selector">
                  {(['ALL', 'ROLE_USER', 'ROLE_FREELANCER'] as NoticeTarget[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`ann-target-btn${targetRole === t ? ' active' : ''}`}
                      onClick={() => setTargetRole(t)}
                    >
                      {TARGET_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ann-field">
                <label htmlFor="notice-title">제목</label>
                <input
                  id="notice-title"
                  className="ann-input"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="공지 제목을 입력하세요"
                  required
                />
              </div>

              <div className="ann-field">
                <label htmlFor="notice-content">내용</label>
                <textarea
                  id="notice-content"
                  className="ann-textarea"
                  rows={6}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="공지 내용을 입력하세요"
                  required
                />
              </div>

              <label className="ann-checkbox">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(event) => setPublishNow(event.target.checked)}
                />
                저장과 동시에 발행
              </label>

              <div className="ann-submit-row">
                <button type="submit" className="ann-submit-btn" disabled={submitting}>
                  {submitting ? '처리 중...' : publishNow ? '공지 발행' : '초안 저장'}
                </button>
                {submitMessage && <p className="ann-feedback">{submitMessage}</p>}
              </div>
            </form>

            {draftNotice && !draftNotice.publishedYn && (
              <div className="ann-draft-box">
                {editingNoticeId === draftNotice.noticeId ? (
                  <div className="ann-admin-form ann-admin-form--draft">
                    <div className="ann-field">
                      <label>대상</label>
                      <div className="ann-target-selector">
                        {(['ALL', 'ROLE_USER', 'ROLE_FREELANCER'] as NoticeTarget[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`ann-target-btn${editingTarget === t ? ' active' : ''}`}
                            onClick={() => setEditingTarget(t)}
                          >
                            {TARGET_LABEL[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ann-field">
                      <label htmlFor="draft-notice-title">제목</label>
                      <input
                        id="draft-notice-title"
                        className="ann-input"
                        type="text"
                        value={editingNoticeTitle}
                        onChange={(event) => setEditingNoticeTitle(event.target.value)}
                        placeholder="공지 제목을 입력하세요"
                        required
                      />
                    </div>
                    <div className="ann-field">
                      <label htmlFor="draft-notice-content">내용</label>
                      <textarea
                        id="draft-notice-content"
                        className="ann-textarea"
                        rows={6}
                        value={editingNoticeContent}
                        onChange={(event) => setEditingNoticeContent(event.target.value)}
                        placeholder="공지 내용을 입력하세요"
                        required
                      />
                    </div>
                    <div className="ann-submit-row">
                      <button
                        type="button"
                        className="ann-submit-btn"
                        onClick={() => void handleUpdateNotice()}
                        disabled={submitting}
                      >
                        {submitting ? '처리 중...' : '수정 저장'}
                      </button>
                      <button type="button" className="ann-cancel-btn" onClick={cancelEditNotice} disabled={submitting}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const { title: draftDisplayTitle, target: draftTarget } = decodeTitle(draftNotice.title);
                      return (
                        <>
                          <p className="ann-draft-title">
                            미발행 초안 #{draftNotice.noticeId}
                            <span className={`ann-type-badge ${TARGET_BADGE_CLASS[draftTarget]}`} style={{ marginLeft: '0.5rem' }}>
                              {TARGET_LABEL[draftTarget]}
                            </span>
                          </p>
                          <p className="ann-draft-meta">{draftDisplayTitle}</p>
                        </>
                      );
                    })()}
                    <div className="ann-draft-actions">
                      <button
                        type="button"
                        className="ann-cancel-btn"
                        onClick={() => beginEditNotice(draftNotice.noticeId, draftNotice.title, draftNotice.content)}
                        disabled={submitting}
                      >
                        수정
                      </button>
                      <button type="button" className="ann-submit-btn" onClick={handlePublishDraft} disabled={submitting}>
                        초안 발행
                      </button>
                      <button
                        type="button"
                        className="ann-delete-btn"
                        onClick={() => void handleDeleteNotice(draftNotice.noticeId)}
                        disabled={submitting}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
