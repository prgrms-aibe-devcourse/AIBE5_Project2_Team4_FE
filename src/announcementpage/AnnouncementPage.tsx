import { useEffect, useState, type FormEvent } from 'react';
import './announcement.css';
import AppHeader from '../components/AppHeader';
import { getUser } from '../store/appAuth';
import { canSendAnnouncement } from '../store/accessControl';
import { createAdminNotice, publishAdminNotice, type AdminNoticeResponse } from '../api/admin';
import { getNotice, getNotices, type NoticeDetailResponse, type NoticeSummaryResponse } from '../api/notices';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/referenceData';

function readNoticeId(): number | null {
  const raw = new URLSearchParams(window.location.search).get('noticeId');
  if (!raw) {
    return null;
  }

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

export default function AnnouncementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [publishError, setPublishError] = useState('');
  const [notices, setNotices] = useState<NoticeSummaryResponse[]>([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(() => readNoticeId());
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draftNotice, setDraftNotice] = useState<AdminNoticeResponse | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = canSendAnnouncement(getUser());

  useEffect(() => {
    const syncNoticeFromLocation = () => {
      setSelectedNoticeId(readNoticeId());
    };

    window.addEventListener('popstate', syncNoticeFromLocation);
    return () => window.removeEventListener('popstate', syncNoticeFromLocation);
  }, []);

  useEffect(() => {
    const loadNotices = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getNotices({ page: 0, size: 30 });
        setNotices(response.content);

        setSelectedNoticeId((current) => current);
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
      return;
    }

    const loadNotice = async () => {
      setDetailLoading(true);
      setPublishError('');

      try {
        const response = await getNotice(selectedNoticeId);
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

  async function refreshNotices(selectNoticeId?: number | null): Promise<void> {
    const response = await getNotices({ page: 0, size: 30 });
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
    if (!isAdmin) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');
    setPublishError('');

    try {
      const created = await createAdminNotice({
        title: title.trim(),
        content: content.trim(),
        publishNow,
      });

      setTitle('');
      setContent('');

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

  async function handlePublishDraft() {
    if (!draftNotice) {
      return;
    }

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
            공개 공지는 누구나 볼 수 있고, 관리자만 새 공지를 작성하고 발행할 수 있습니다.
          </p>
        </div>

        {error && <p className="ann-feedback ann-feedback--error">{error}</p>}

        <section className="ann-card">
          <h2 className="ann-card-title">공지 목록</h2>
          {loading ? (
            <p className="ann-empty">목록을 불러오는 중입니다.</p>
          ) : notices.length === 0 ? (
            <p className="ann-empty">등록된 공지가 없습니다.</p>
          ) : (
            <ul className="ann-history-list">
              {notices.map((notice) => (
                <li key={notice.noticeId} className="ann-history-item">
                  <button
                    type="button"
                    className="ann-history-button"
                    onClick={() => setSelectedNoticeId(notice.noticeId)}
                  >
                    <div className="ann-history-top">
                      <span className="ann-type-badge ann-type-badge--general">공지</span>
                      <span className="ann-history-date">{formatDateTime(notice.publishedAt)}</span>
                    </div>
                    <div className="ann-history-title">{notice.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedNoticeId && (
          <div className="ann-modal-backdrop" onClick={() => setSelectedNoticeId(null)}>
            <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ann-modal-close"
                onClick={() => setSelectedNoticeId(null)}
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              {detailLoading ? (
                <p className="ann-empty">불러오는 중입니다...</p>
              ) : selectedNotice ? (
                <article className="ann-detail">
                  <div className="ann-history-top">
                    <span className="ann-type-badge ann-type-badge--general">공지</span>
                    <span className="ann-history-date">{formatDateTime(selectedNotice.publishedAt)}</span>
                  </div>
                  <h3 className="ann-detail-title">{selectedNotice.title}</h3>
                  <p className="ann-detail-body">{selectedNotice.content}</p>
                </article>
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
                <p className="ann-draft-title">미발행 초안 #{draftNotice.noticeId}</p>
                <p className="ann-draft-meta">{draftNotice.title}</p>
                <button type="button" className="ann-submit-btn" onClick={handlePublishDraft} disabled={submitting}>
                  초안 발행
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
