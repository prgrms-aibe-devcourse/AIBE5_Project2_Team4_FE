import { useCallback, useEffect, useState } from 'react';
import './mypage.css';
import AppHeader from '../components/AppHeader';
import { bootstrapSession, getUser, setUser, type User } from '../store/appAuth';
import { canManageVerification, canModerateReviews, canModifyOwnReview } from '../store/accessControl';
import { downloadFile, openFileInNewTab } from '../api/files';
import {
  approveAdminVerification,
  blindAdminReview,
  cancelAdminProject,
  getAdminDashboard,
  getAdminFreelancer,
  getAdminFreelancers,
  getAdminProject,
  getAdminProjects,
  getAdminReport,
  getAdminReports,
  getAdminReviews,
  getAdminVerification,
  getAdminVerifications,
  rejectAdminReport,
  rejectAdminVerification,
  resolveAdminReport,
  unblindAdminReview,
  updateAdminFreelancerActive,
  updateAdminFreelancerVisibility,
  type AdminDashboardResponse,
  type AdminFreelancerDetailResponse,
  type AdminFreelancerListItemResponse,
  type AdminProjectDetailResponse,
  type AdminProjectSummaryResponse,
  type AdminReportDetailResponse,
  type AdminReportListItemResponse,
  type AdminReviewListItemResponse,
  type AdminVerificationDetailResponse,
  type AdminVerificationListItemResponse,
} from '../api/admin';
import { getAvailableTimeSlotCodes, getProjectTypeCodes, getRegionCodes, type CodeLookupResponse } from '../api/codes';
import {
  createMyFreelancerProfile,
  deleteMyFreelancerFile,
  getMyFreelancerFiles,
  getMyFreelancerProfile,
  updateMyFreelancerProfile,
  uploadMyFreelancerFile,
  type FreelancerDetailResponse,
  type FreelancerFileResponse,
} from '../api/freelancers';
import { getMyReports, type ReportSummaryResponse } from '../api/reports';
import {
  deleteMyReview,
  getMyReceivedReviews,
  getMyReviews,
  getReviewTagCodes,
  updateMyReview,
  type ReviewSummaryResponse,
  type ReviewTagCodeResponse,
} from '../api/reviews';
import {
  createMyVerification,
  deleteVerificationFile,
  getMyVerification,
  getVerificationFiles,
  getMyVerifications,
  uploadVerificationFile,
  type VerificationFileResponse,
  type VerificationResponse,
  type VerificationType,
} from '../api/verifications';
import { getMyPage, updateMyProfile, type UserMyPageResponse } from '../api/users';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, labelOf } from '../lib/referenceData';
import { projectStatusLabel, roleLabel, verificationStatusLabel } from '../lib/koreanLabels';
import VerifyTab from './tabs/VerifyTab';
import ReviewsTab from './tabs/ReviewsTab';
import ReportsTab from './tabs/ReportsTab';
import UsageReportTab from './tabs/UsageReportTab';
import { STATUS_LABEL, VERIFICATION_TYPE_LABEL } from './tabs/verifyTabShared';
import type { VerifyStatus } from './tabs/verifyTabShared';
import AccountTabContent from './components/AccountTabContent';
import {
  ADMIN_LOAD_ERROR_MESSAGES,
  EMPTY_FREELANCER_FORM,
  EMPTY_PROFILE_FORM,
  EMPTY_REVIEW_EDITOR,
  resolveRequestedTab,
  toggleSelection,
  toFreelancerForm,
  toFreelancerRequest,
  updateTabQuery,
  type AdminLoadErrors,
  type FreelancerFormState,
  type ProfileFormState,
  type Tab,
} from './myPageShared';

function readRequestedReviewId(): number | null {
  const raw = new URLSearchParams(window.location.search).get('reviewId');
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function clearRequestedReviewId(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('reviewId')) {
    return;
  }

  url.searchParams.delete('reviewId');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export default function MyPage2() {
  const [user, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [freelancerForm, setFreelancerForm] = useState<FreelancerFormState>(EMPTY_FREELANCER_FORM);
  const [applyForm, setApplyForm] = useState<FreelancerFormState>(EMPTY_FREELANCER_FORM);
  const [applyFiles, setApplyFiles] = useState<File[]>([]);
  const [showMateApplyForm, setShowMateApplyForm] = useState(false);
  const [showFreelancerProfileForm, setShowFreelancerProfileForm] = useState(false);
  const [summary, setSummary] = useState<UserMyPageResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewSummaryResponse[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<ReviewSummaryResponse[]>([]);
  const [reports, setReports] = useState<ReportSummaryResponse[]>([]);
  const [reviewTags, setReviewTags] = useState<ReviewTagCodeResponse[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(EMPTY_REVIEW_EDITOR.rating);
  const [editTagCodes, setEditTagCodes] = useState<string[]>(EMPTY_REVIEW_EDITOR.tagCodes);
  const [editContent, setEditContent] = useState(EMPTY_REVIEW_EDITOR.content);

  const [projectTypeOptions, setProjectTypeOptions] = useState<CodeLookupResponse[]>([]);
  const [regionOptions, setRegionOptions] = useState<CodeLookupResponse[]>([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState<CodeLookupResponse[]>([]);
  const [projectTypeMap, setProjectTypeMap] = useState<Map<string, string>>(new Map());
  const [regionMap, setRegionMap] = useState<Map<string, string>>(new Map());
  const [timeSlotMap, setTimeSlotMap] = useState<Map<string, string>>(new Map());

  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerDetailResponse | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<FreelancerFileResponse[]>([]);
  const [verifications, setVerifications] = useState<VerificationResponse[]>([]);
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<VerificationResponse | null>(null);
  const [selectedVerificationFiles, setSelectedVerificationFiles] = useState<VerificationFileResponse[]>([]);
  const [newVerificationType, setNewVerificationType] = useState<VerificationType>('BASIC_IDENTITY');
  const [newVerificationMessage, setNewVerificationMessage] = useState('');

  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardResponse | null>(null);
  const [adminFreelancers, setAdminFreelancers] = useState<AdminFreelancerListItemResponse[]>([]);
  const [selectedAdminFreelancer, setSelectedAdminFreelancer] = useState<AdminFreelancerDetailResponse | null>(null);
  const [adminProjects, setAdminProjects] = useState<AdminProjectSummaryResponse[]>([]);
  const [selectedAdminProject, setSelectedAdminProject] = useState<AdminProjectDetailResponse | null>(null);
  const [adminVerifications, setAdminVerifications] = useState<AdminVerificationListItemResponse[]>([]);
  const [verifyFilter, setVerifyFilter] = useState<VerifyStatus>('ALL');
  const [selectedAdminVerification, setSelectedAdminVerification] = useState<AdminVerificationDetailResponse | null>(null);
  const [adminReviews, setAdminReviews] = useState<AdminReviewListItemResponse[]>([]);
  const [adminReports, setAdminReports] = useState<AdminReportListItemResponse[]>([]);
  const [selectedAdminReport, setSelectedAdminReport] = useState<AdminReportDetailResponse | null>(null);
  const [adminLoadErrors, setAdminLoadErrors] = useState<AdminLoadErrors>({});

  const loadAdminData = useCallback(async () => {
    setAdminLoadErrors({});

    try {
      setAdminDashboard(await getAdminDashboard());
    } catch (caughtError) {
      setAdminDashboard(null);
      setAdminLoadErrors((current) => ({
        ...current,
        dashboard: getErrorMessage(caughtError, ADMIN_LOAD_ERROR_MESSAGES.dashboard),
      }));
    }

    const [
      freelancerResult,
      projectResult,
      verificationResult,
      reviewResult,
      reportResult,
    ] = await Promise.allSettled([
      getAdminFreelancers({ page: 0, size: 50 }),
      getAdminProjects({ page: 0, size: 50 }),
      getAdminVerifications({ page: 0, size: 50 }),
      getAdminReviews({ page: 0, size: 50 }),
      getAdminReports({ page: 0, size: 50 }),
    ]);

    const nextAdminLoadErrors: AdminLoadErrors = {};

    if (freelancerResult.status === 'fulfilled') {
      setAdminFreelancers(freelancerResult.value.content);
    } else {
      setAdminFreelancers([]);
      nextAdminLoadErrors.freelancers = getErrorMessage(freelancerResult.reason, ADMIN_LOAD_ERROR_MESSAGES.freelancers);
    }

    if (projectResult.status === 'fulfilled') {
      setAdminProjects(projectResult.value.content);
    } else {
      setAdminProjects([]);
      nextAdminLoadErrors.projects = getErrorMessage(projectResult.reason, ADMIN_LOAD_ERROR_MESSAGES.projects);
    }

    if (verificationResult.status === 'fulfilled') {
      setAdminVerifications(verificationResult.value.content);
    } else {
      setAdminVerifications([]);
      nextAdminLoadErrors.verifications = getErrorMessage(
        verificationResult.reason,
        ADMIN_LOAD_ERROR_MESSAGES.verifications,
      );
    }

    if (reviewResult.status === 'fulfilled') {
      setAdminReviews(reviewResult.value.content);
    } else {
      setAdminReviews([]);
      nextAdminLoadErrors.reviews = getErrorMessage(reviewResult.reason, ADMIN_LOAD_ERROR_MESSAGES.reviews);
    }

    if (reportResult.status === 'fulfilled') {
      setAdminReports(reportResult.value.content);
    } else {
      setAdminReports([]);
      nextAdminLoadErrors.reports = getErrorMessage(reportResult.reason, ADMIN_LOAD_ERROR_MESSAGES.reports);
    }

    setAdminLoadErrors((current) => ({
      ...current,
      ...nextAdminLoadErrors,
    }));
  }, []);

  useEffect(() => {
    const nextUser = getUser();
    if (!nextUser) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(nextUser);
    setActiveTab(resolveRequestedTab(nextUser));
  }, []);

  useEffect(() => {
    const syncRequestedTab = () => {
      const nextUser = getUser();
      if (!nextUser) {
        return;
      }

      const tab = resolveRequestedTab(nextUser);
      setActiveTab(tab);

      if (tab === 'reports' && (nextUser.role === 'ROLE_USER' || nextUser.role === 'ROLE_FREELANCER')) {
        void getMyReports({ page: 0, size: 100 }).then((reportPage) => {
          setReports(reportPage.content);
        });
      }
    };

    window.addEventListener('popstate', syncRequestedTab);
    return () => window.removeEventListener('popstate', syncRequestedTab);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectTypes, regions, timeSlots, tagCodes] = await Promise.all([
          getProjectTypeCodes(),
          getRegionCodes(),
          getAvailableTimeSlotCodes(),
          getReviewTagCodes(),
        ]);
        setProjectTypeOptions(projectTypes);
        setRegionOptions(regions);
        setTimeSlotOptions(timeSlots);
        setReviewTags(tagCodes);
        setProjectTypeMap(new Map(projectTypes.map((item) => [item.code, item.name])));
        setRegionMap(new Map(regions.map((item) => [item.code, item.name])));
        setTimeSlotMap(new Map(timeSlots.map((item) => [item.code, item.name])));

        const myPageResponse = await getMyPage();
        setSummary(myPageResponse);
        setProfileForm({
          name: myPageResponse.user.name,
          phone: myPageResponse.user.phone ?? '',
          intro: myPageResponse.user.intro ?? '',
        });

        if (user.role === 'ROLE_USER' || user.role === 'ROLE_FREELANCER') {
          const [reviewPage, receivedReviewPage, reportPage] = await Promise.all([
            getMyReviews({ page: 0, size: 100 }),
            getMyReceivedReviews({ page: 0, size: 100 }),
            getMyReports({ page: 0, size: 100 }),
          ]);

          setReviews(reviewPage.content);
          setReceivedReviews(receivedReviewPage.content);
          setReports(reportPage.content);
        } else {
          setReviews([]);
          setReceivedReviews([]);
          setReports([]);
        }

        if (user.role === 'ROLE_FREELANCER') {
          try {
            const profile = await getMyFreelancerProfile();
            setFreelancerProfile(profile);
            setFreelancerForm(toFreelancerForm(profile));

            const [files, myVerifications] = await Promise.all([
              getMyFreelancerFiles(),
              getMyVerifications(),
            ]);

            setPortfolioFiles(files);
            setVerifications(myVerifications);
          } catch (caughtError) {
            const message = getErrorMessage(caughtError, '');
            if (!message.includes('404')) {
              setError(message);
            }
            setFreelancerProfile(null);
            setFreelancerForm(EMPTY_FREELANCER_FORM);
            setPortfolioFiles([]);
            setVerifications([]);
          }
        }

        if (user.role === 'ROLE_ADMIN') {
          await loadAdminData();
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '마이페이지 데이터를 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [loadAdminData, user]);

  async function refreshProfileSummary() {
    const myPageResponse = await getMyPage();
    setSummary(myPageResponse);

    if (user?.role === 'ROLE_USER' || user?.role === 'ROLE_FREELANCER') {
      const [reviewPage, receivedReviewPage, reportPage] = await Promise.all([
        getMyReviews({ page: 0, size: 100 }),
        getMyReceivedReviews({ page: 0, size: 100 }),
        getMyReports({ page: 0, size: 100 }),
      ]);

      setReviews(reviewPage.content);
      setReceivedReviews(receivedReviewPage.content);
      setReports(reportPage.content);
      return;
    }

    setReviews([]);
    setReceivedReviews([]);
    setReports([]);
  }

  async function refreshFreelancerWorkspace() {
    if (user?.role !== 'ROLE_FREELANCER') {
      return;
    }

    try {
      const profile = await getMyFreelancerProfile();
      setFreelancerProfile(profile);
      setFreelancerForm(toFreelancerForm(profile));
      const [files, myVerifications] = await Promise.all([
        getMyFreelancerFiles(),
        getMyVerifications(),
      ]);
      setPortfolioFiles(files);
      setVerifications(myVerifications);
    } catch {
      setFreelancerProfile(null);
      setPortfolioFiles([]);
      setVerifications([]);
    }
  }

  async function refreshAdminData() {
    if (user?.role !== 'ROLE_ADMIN') {
      return;
    }

    await loadAdminData();
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    updateTabQuery(tab);

    if (tab === 'reports' && (user?.role === 'ROLE_USER' || user?.role === 'ROLE_FREELANCER')) {
      void getMyReports({ page: 0, size: 100 }).then((reportPage) => {
        setReports(reportPage.content);
      });
    }
  }

  function startEditReview(review: ReviewSummaryResponse) {
    setEditingReviewId(review.reviewId);
    setEditRating(review.rating);
    setEditTagCodes(review.tagCodes);
    setEditContent(review.content);
  }

  async function handleAccountSave() {
    if (!user) {
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updated = await updateMyProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
        intro: profileForm.intro.trim() || undefined,
      });

      const updatedUser: User = {
        ...user,
        name: updated.name,
        phone: updated.phone ?? undefined,
        intro: updated.intro ?? undefined,
        bio: updated.intro ?? undefined,
        active: updated.active,
      };

      setUser(updatedUser);
      setCurrentUser(updatedUser);
      await refreshProfileSummary();
      setNotice('계정 정보를 저장했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '계정 정보 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyAsFreelancer() {
    if (!showMateApplyForm) {
      setShowMateApplyForm(true);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const createdProfile = await createMyFreelancerProfile(toFreelancerRequest(applyForm));

      for (const file of applyFiles) {
        await uploadMyFreelancerFile(file);
      }

      setNotice('프리랜서 프로필 정보를 동기화하는 중입니다.');
      const nextUser = await bootstrapSession(true);
      const syncedUser = nextUser ?? {
        ...user!,
        role: 'ROLE_FREELANCER' as const,
        roleCode: 'ROLE_FREELANCER' as const,
      };

      setUser(syncedUser);
      setCurrentUser(syncedUser);
      setFreelancerProfile(createdProfile);
      setFreelancerForm(toFreelancerForm(createdProfile));
      setApplyForm(EMPTY_FREELANCER_FORM);
      setApplyFiles([]);
      setShowMateApplyForm(false);
      const uploadedFiles = await getMyFreelancerFiles();
      setPortfolioFiles(uploadedFiles);
      setVerifications(await getMyVerifications());
      await refreshProfileSummary();
      handleTabChange('certify');
      const fileMsg = applyFiles.length > 0 ? ` 포트폴리오 ${applyFiles.length}개가 업로드되었습니다.` : '';
      setNotice(`프리랜서 프로필 신청이 완료되었습니다.${fileMsg} 인증 요청을 등록해 주세요.`);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '메이트 신청에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function handleApplyFileAdd(files: File[]) {
    if (files.length === 0) return;
    setApplyFiles((prev) => [...prev, ...files]);
  }

  function handleApplyFileRemove(index: number) {
    setApplyFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFreelancerProfileSave() {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (freelancerProfile) {
        await updateMyFreelancerProfile(toFreelancerRequest(freelancerForm));
      } else {
        await createMyFreelancerProfile(toFreelancerRequest(freelancerForm));
      }

      await refreshFreelancerWorkspace();
      await refreshProfileSummary();
      setNotice('프리랜서 프로필을 저장했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 프로필 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePortfolioUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setSaving(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        await uploadMyFreelancerFile(file);
      }
      await refreshFreelancerWorkspace();
      setNotice('포트폴리오 파일을 업로드했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '포트폴리오 업로드에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePortfolioDelete(fileId: number) {
    setSaving(true);
    setError('');

    try {
      await deleteMyFreelancerFile(fileId);
      await refreshFreelancerWorkspace();
      setNotice('포트폴리오 파일을 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '포트폴리오 파일 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleFileView(fileUrl: string) {
    setError('');

    try {
      await openFileInNewTab(fileUrl);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '파일을 열지 못했습니다.'));
    }
  }

  async function handleFileDownload(fileUrl: string) {
    setError('');

    try {
      await downloadFile(fileUrl);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '파일을 다운로드하지 못했습니다.'));
    }
  }

  async function handleCreateVerification() {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const created = await createMyVerification({
        type: newVerificationType,
        requestMessage: newVerificationMessage.trim() || undefined,
      });
      setSelectedVerificationId(created.verificationId);
      setNewVerificationMessage('');
      await refreshFreelancerWorkspace();
      await handleVerificationSelect(created.verificationId, true);
      setNotice('인증 요청을 등록했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 등록에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationSelect(verificationId: number, forceOpen = false) {
    if (!forceOpen && selectedVerificationId === verificationId) {
      setSelectedVerificationId(null);
      setSelectedVerification(null);
      setSelectedVerificationFiles([]);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const [verification, files] = await Promise.all([
        getMyVerification(verificationId),
        getVerificationFiles(verificationId),
      ]);

      setSelectedVerificationId(verificationId);
      setSelectedVerification(verification);
      setSelectedVerificationFiles(files);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !selectedVerificationId) return;

    setSaving(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        await uploadVerificationFile(selectedVerificationId, file);
      }
      await handleVerificationSelect(selectedVerificationId, true);
      await refreshFreelancerWorkspace();
      setNotice('인증 파일을 업로드했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 파일 업로드에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerificationFileDelete(fileId: number) {
    if (!selectedVerificationId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteVerificationFile(fileId);
      await handleVerificationSelect(selectedVerificationId, true);
      await refreshFreelancerWorkspace();
      setNotice('인증 파일을 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 파일 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function handleEditTagToggle(tagCode: string) {
    setEditTagCodes((current) => toggleSelection(current, tagCode));
  }

  async function handleReviewUpdate(reviewId: number) {
    const target = reviews.find((review) => review.reviewId === reviewId);
    if (!target || !canModifyOwnReview(user, { reviewerUserId: target.reviewerUserId })) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateMyReview(reviewId, {
        rating: editRating,
        tagCodes: editTagCodes,
        content: editContent,
      });

      setEditingReviewId(null);
      await refreshProfileSummary();
      setNotice('리뷰를 수정했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 수정에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewDelete(reviewId: number) {
    const target = reviews.find((review) => review.reviewId === reviewId);
    if (!target || !canModifyOwnReview(user, { reviewerUserId: target.reviewerUserId })) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteMyReview(reviewId);
      setEditingReviewId(null);
      await refreshProfileSummary();
      setNotice('리뷰를 삭제했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 삭제에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminFreelancer(freelancerProfileId: number) {
    if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
      setSelectedAdminFreelancer(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminFreelancer(freelancerProfileId);
      setSelectedAdminFreelancer(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdminFreelancerVisibility(freelancerProfileId: number, publicYn: boolean) {
    setSaving(true);
    setError('');

    try {
      await updateAdminFreelancerVisibility(freelancerProfileId, !publicYn);
      await refreshAdminData();
      if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
        const detail = await getAdminFreelancer(freelancerProfileId);
        setSelectedAdminFreelancer(detail);
      }
      setNotice('프리랜서 공개 여부를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 공개 여부 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdminFreelancerActive(freelancerProfileId: number, activeYn: boolean) {
    setSaving(true);
    setError('');

    try {
      await updateAdminFreelancerActive(freelancerProfileId, !activeYn);
      await refreshAdminData();
      if (selectedAdminFreelancer?.freelancerProfileId === freelancerProfileId) {
        const detail = await getAdminFreelancer(freelancerProfileId);
        setSelectedAdminFreelancer(detail);
      }
      setNotice('프리랜서 활성 상태를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프리랜서 활성 상태 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminProject(projectId: number) {
    if (selectedAdminProject?.projectId === projectId) {
      setSelectedAdminProject(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminProject(projectId);
      setSelectedAdminProject(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelAdminProject(projectId: number) {
    const reason = window.prompt('취소 사유를 입력하세요.');
    if (!reason?.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await cancelAdminProject(projectId, reason.trim());
      await refreshAdminData();
      if (selectedAdminProject?.projectId === projectId) {
        const detail = await getAdminProject(projectId);
        setSelectedAdminProject(detail);
      }
      setNotice('프로젝트를 취소했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 취소에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminVerification(verificationId: number) {
    if (selectedAdminVerification?.verificationId === verificationId) {
      setSelectedAdminVerification(null);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const detail = await getAdminVerification(verificationId);
      setSelectedAdminVerification(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 요청 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveVerification(verificationId: number) {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      await approveAdminVerification(verificationId);
      await refreshAdminData();
      setSelectedAdminVerification(null);
      setNotice('인증 요청을 승인했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 승인에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectVerification(verificationId: number) {
    if (!canManageVerification(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    const reviewComment = window.prompt('반려 사유를 입력하세요.');
    if (!reviewComment?.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await rejectAdminVerification(verificationId, reviewComment.trim());
      await refreshAdminData();
      setSelectedAdminVerification(null);
      setNotice('인증 요청을 반려했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '인증 반려에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminBlindToggle(reviewId: number, blindedYn: boolean) {
    if (!canModerateReviews(user)) {
      window.location.href = '/error?code=403';
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (blindedYn) {
        await unblindAdminReview(reviewId);
      } else {
        const reason = window.prompt('블라인드 사유를 입력하세요.')?.trim() || '관리자 조치';
        await blindAdminReview(reviewId, reason);
      }

      await refreshAdminData();
      setNotice('리뷰 노출 상태를 변경했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 상태 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAdminReport(reportId: number) {
    if (selectedAdminReport?.reportId === reportId) {
      handleCloseAdminReport();
      return;
    }

    clearRequestedReviewId();
    setSaving(true);
    setError('');

    try {
      const detail = await getAdminReport(reportId);
      setSelectedAdminReport(detail);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 상세를 불러오지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  function handleCloseAdminReport() {
    clearRequestedReviewId();
    setSelectedAdminReport(null);
  }

  async function handleResolveAdminReport(reportId: number) {
    setSaving(true);
    setError('');

    try {
      await resolveAdminReport(reportId);
      await refreshAdminData();
      handleCloseAdminReport();
      setNotice('신고를 승인 처리했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 승인 처리에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectAdminReport(reportId: number) {
    setSaving(true);
    setError('');

    try {
      await rejectAdminReport(reportId);
      await refreshAdminData();
      handleCloseAdminReport();
      setNotice('신고를 반려 처리했습니다.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '신고 반려 처리에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN' || activeTab !== 'reports') {
      return;
    }

    const requestedReviewId = readRequestedReviewId();
    if (requestedReviewId == null || adminReports.length === 0) {
      return;
    }

    const matchingReport = adminReports.find((report) => report.reviewId === requestedReviewId);
    if (!matchingReport || selectedAdminReport?.reportId === matchingReport.reportId) {
      return;
    }

    const reportId = matchingReport.reportId;
    let cancelled = false;
    async function selectRequestedReport() {
      try {
        const detail = await getAdminReport(reportId);
        if (!cancelled) {
          setSelectedAdminReport(detail);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(getErrorMessage(caughtError, '신고 상세를 불러오지 못했습니다.'));
        }
      }
    }

    void selectRequestedReport();
    return () => {
      cancelled = true;
    };
  }, [activeTab, adminReports, selectedAdminReport?.reportId, user?.role]);

  if (!user || loading) {
    return (
      <div className="mypage">
        <AppHeader activePage="mypage" />
        <main className="mypage-content">
          <p className="empty-msg">마이페이지를 준비하는 중입니다.</p>
        </main>
      </div>
    );
  }

  const isAdmin = user.role === 'ROLE_ADMIN';
  const isFreelancer = user.role === 'ROLE_FREELANCER';
  const adminReportLoadErrors = [adminLoadErrors.reviews, adminLoadErrors.reports].filter(
    (message): message is string => Boolean(message),
  );
  const usageReportLoadErrors = [
    adminLoadErrors.dashboard,
    adminLoadErrors.freelancers,
    adminLoadErrors.projects,
    adminLoadErrors.reviews,
    adminLoadErrors.reports,
  ].filter((message): message is string => Boolean(message));

  return (
    <div className="mypage">
      <AppHeader activePage="mypage" />

      <main className="mypage-content">
        <div className="profile-section">
          <div className="avatar-wrap">
            <span className="avatar-initial">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h1 className="username">{user.name}</h1>
            <p className="email">{user.email}</p>
            <div className="profile-badges">
              <span className={`role-badge role-badge--${user.role.toLowerCase().replace('role_', '')}`}>{roleLabel(user.role)}</span>
              {summary?.freelancerProfile?.verifiedYn && <span className="verified-badge">인증 프로필</span>}
            </div>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-success">{notice}</p>}

        <div className="tab-bar">
          {!isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'account' ? ' active' : ''}`} onClick={() => handleTabChange('account')}>계정 정보</button>
              <button className={`tab-btn${activeTab === 'reviews' ? ' active' : ''}`} onClick={() => handleTabChange('reviews')}>리뷰</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => handleTabChange('reports')}>신고</button>
              {isFreelancer && (
                <button className={`tab-btn${activeTab === 'certify' ? ' active' : ''}`} onClick={() => handleTabChange('certify')}>인증/포트폴리오</button>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => handleTabChange('dashboard')}>대시보드</button>
              <button className={`tab-btn${activeTab === 'freelancers' ? ' active' : ''}`} onClick={() => handleTabChange('freelancers')}>프리랜서</button>
              <button className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`} onClick={() => handleTabChange('projects')}>프로젝트</button>
              <button className={`tab-btn${activeTab === 'verify' ? ' active' : ''}`} onClick={() => handleTabChange('verify')}>인증 심사</button>
              <button className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`} onClick={() => handleTabChange('reports')}>리뷰/신고</button>
              <button className={`tab-btn${activeTab === 'usage-report' ? ' active' : ''}`} onClick={() => handleTabChange('usage-report')}>운영 리포트</button>
            </>
          )}
        </div>

        {activeTab === 'account' && !isAdmin && (
          <AccountTabContent
            user={user}
            summary={summary}
            saving={saving}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            onSaveAccount={() => void handleAccountSave()}
            isFreelancer={isFreelancer}
            showMateApplyForm={showMateApplyForm}
            setShowMateApplyForm={setShowMateApplyForm}
            applyForm={applyForm}
            setApplyForm={setApplyForm}
            applyFiles={applyFiles}
            onApplyFileAdd={handleApplyFileAdd}
            onApplyFileRemove={handleApplyFileRemove}
            onApplyAsFreelancer={() => void handleApplyAsFreelancer()}
            showFreelancerProfileForm={showFreelancerProfileForm}
            setShowFreelancerProfileForm={setShowFreelancerProfileForm}
            freelancerForm={freelancerForm}
            setFreelancerForm={setFreelancerForm}
            onSaveFreelancerProfile={() => void handleFreelancerProfileSave()}
            regionOptions={regionOptions}
            regionMap={regionMap}
            timeSlotOptions={timeSlotOptions}
            projectTypeOptions={projectTypeOptions}
          />
        )}

        {activeTab === 'reviews' && !isAdmin && (
          <ReviewsTab
            reviews={reviews}
            receivedReviews={receivedReviews}
            editingReviewId={editingReviewId}
            editRating={editRating}
            editTagCodes={editTagCodes}
            editContent={editContent}
            reviewTags={reviewTags}
            canEdit
            setEditingReviewId={setEditingReviewId}
            setEditRating={setEditRating}
            setEditContent={setEditContent}
            handleEditTagToggle={handleEditTagToggle}
            handleReviewUpdate={(reviewId) => void handleReviewUpdate(reviewId)}
            handleReviewDelete={(reviewId) => void handleReviewDelete(reviewId)}
            startEditReview={startEditReview}
          />
        )}

        {activeTab === 'reports' && !isAdmin && (
          <ReportsTab mode="user" reports={reports} />
        )}

        {activeTab === 'certify' && isFreelancer && (
          <div className="tab-content">
            <div className="account-card">
              <div className="account-card-head">
                <h2>포트폴리오</h2>
                <label className="btn-edit">
                  파일 업로드
                  <input hidden type="file" multiple onChange={(event) => void handlePortfolioUpload(event.target.files)} />
                </label>
              </div>
              {portfolioFiles.length === 0 ? (
                <p className="empty-msg">등록된 포트폴리오 파일이 없습니다.</p>
              ) : (
                <ul className="admin-list">
                  {portfolioFiles.map((file) => (
                    <li key={file.fileId} className="admin-item">
                      <div>
                        <strong>{file.originalFilename}</strong>
                        <p className="admin-subtext">{formatDateTime(file.uploadedAt)}</p>
                      </div>
                      <div className="admin-item-right">
                        <button type="button" className="btn-edit" onClick={() => void handleFileView(file.viewUrl)}>보기</button>
                        <button type="button" className="btn-edit" onClick={() => void handleFileDownload(file.downloadUrl)}>다운로드</button>
                        <button className="btn-cancel" onClick={() => void handlePortfolioDelete(file.fileId)}>삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <div className="account-card-head">
                  <h2>인증 요청</h2>
                  <button className="btn-edit" onClick={() => void handleCreateVerification()} disabled={saving}>등록</button>
                </div>
                <div className="account-edit-form">
                  <div className="account-field">
                  <label>인증 유형</label>
                  <select className="account-input" value={newVerificationType} onChange={(event) => setNewVerificationType(event.target.value as VerificationType)}>
                    <option value="BASIC_IDENTITY">{VERIFICATION_TYPE_LABEL.BASIC_IDENTITY}</option>
                    <option value="LICENSE">{VERIFICATION_TYPE_LABEL.LICENSE}</option>
                    <option value="CAREGIVER">{VERIFICATION_TYPE_LABEL.CAREGIVER}</option>
                  </select>
                </div>
                <div className="account-field">
                  <label>요청 메시지</label>
                  <textarea className="account-textarea" rows={4} value={newVerificationMessage} onChange={(event) => setNewVerificationMessage(event.target.value)} />
                </div>
              </div>

              <ul className="verify-list">
                {verifications.map((verification) => (
                  <li key={verification.verificationId} className="verify-item">
                    <div className="verify-info">
                      <div className="verify-name">{VERIFICATION_TYPE_LABEL[verification.type]}</div>
                      <div className="verify-email">{formatDateTime(verification.requestedAt)}</div>
                    </div>
                    <div className="verify-right">
                      <span className={`verify-status verify-status--${verification.status.toLowerCase()}`}>{verificationStatusLabel(verification.status)}</span>
                      <button className="verify-btn verify-btn--detail" onClick={() => void handleVerificationSelect(verification.verificationId)}>
                        {selectedVerificationId === verification.verificationId ? '닫기' : '상세'}
                      </button>
                    </div>
                  </li>
                ))}
                {verifications.length === 0 && <p className="empty-msg">등록된 인증 요청이 없습니다.</p>}
              </ul>
            </div>

            {selectedVerification && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <div className="account-card-head">
                  <h2>인증 파일 관리</h2>
                  <label className="btn-edit">
                    파일 업로드
                    <input hidden type="file" multiple onChange={(event) => void handleVerificationFileUpload(event.target.files)} />
                  </label>
                </div>
                <ul className="account-info-list">
                  <li><span>유형</span><span>{VERIFICATION_TYPE_LABEL[selectedVerification.type]}</span></li>
                  <li><span>상태</span><span>{STATUS_LABEL[selectedVerification.status]}</span></li>
                  <li><span>요청일</span><span>{formatDateTime(selectedVerification.requestedAt)}</span></li>
                  <li><span>반려 사유</span><span>{selectedVerification.rejectReason || '-'}</span></li>
                </ul>
                {selectedVerificationFiles.length === 0 ? (
                  <p className="empty-msg">첨부 파일이 없습니다.</p>
                ) : (
                  <ul className="admin-list">
                    {selectedVerificationFiles.map((file) => (
                      <li key={file.verificationFileId} className="admin-item">
                        <div>
                          <strong>{file.originalFilename}</strong>
                          <p className="admin-subtext">{formatDateTime(file.uploadedAt)}</p>
                        </div>
                        <div className="admin-item-right">
                          <button type="button" className="btn-edit" onClick={() => void handleFileView(file.viewUrl)}>보기</button>
                          <button type="button" className="btn-edit" onClick={() => void handleFileDownload(file.downloadUrl)}>다운로드</button>
                          <button className="btn-cancel" onClick={() => void handleVerificationFileDelete(file.verificationFileId)}>삭제</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && isAdmin && (
          <div className="tab-content">
            {adminLoadErrors.dashboard && <p className="login-error">{adminLoadErrors.dashboard}</p>}
            {adminDashboard ? (
              <>
                <div className="admin-grid">
                  <div className="metric-card">
                    <span className="metric-label">전체 사용자</span>
                    <strong className="metric-value">{adminDashboard.totalUsers}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">프리랜서</span>
                    <strong className="metric-value">{adminDashboard.totalFreelancers}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">대기 검증</span>
                    <strong className="metric-value">{adminDashboard.pendingVerifications}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">미처리 신고</span>
                    <strong className="metric-value">{adminDashboard.pendingReports}</strong>
                  </div>
                </div>

                <div className="admin-list" style={{ marginTop: '1.5rem' }}>
                  {adminDashboard.recentProjects.map((project) => (
                    <div key={project.projectId} className="admin-item">
                      <div>
                        <strong>{project.title}</strong>
                        <p className="admin-subtext">작성자 {project.ownerName}</p>
                      </div>
                      <span className="admin-subtext">{projectStatusLabel(project.status)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              !adminLoadErrors.dashboard && <p className="empty-msg">관리자 대시보드에 표시할 데이터가 없습니다.</p>
            )}
          </div>
        )}

        {activeTab === 'freelancers' && isAdmin && (
          <div className="tab-content">
            {adminLoadErrors.freelancers && <p className="login-error">{adminLoadErrors.freelancers}</p>}
            <ul className="admin-list">
              {adminFreelancers.map((freelancer) => (
                <li key={freelancer.freelancerProfileId} className="admin-item">
                  <div>
                    <strong>{freelancer.name}</strong>
                    <p className="admin-subtext">{freelancer.email}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{freelancer.verifiedYn ? '검증완료' : '미검증'}</span>
                    <button className="btn-edit" onClick={() => void handleSelectAdminFreelancer(freelancer.freelancerProfileId)}>상세</button>
                    <button className="btn-edit" onClick={() => void handleToggleAdminFreelancerVisibility(freelancer.freelancerProfileId, freelancer.publicYn)}>
                      {freelancer.publicYn ? '비공개' : '공개'}
                    </button>
                    <button className="btn-cancel" onClick={() => void handleToggleAdminFreelancerActive(freelancer.freelancerProfileId, freelancer.activeYn)}>
                      {freelancer.activeYn ? '비활성' : '활성'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedAdminFreelancer && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <h2>{selectedAdminFreelancer.name}</h2>
                <ul className="account-info-list">
                  <li><span>이메일</span><span>{selectedAdminFreelancer.email}</span></li>
                  <li><span>공개 여부</span><span>{selectedAdminFreelancer.publicYn ? '공개' : '비공개'}</span></li>
                  <li><span>활성 여부</span><span>{selectedAdminFreelancer.activeYn ? '활성' : '비활성'}</span></li>
                  <li><span>평점</span><span>{selectedAdminFreelancer.averageRating ?? '-'}</span></li>
                  <li><span>활동 지역</span><span>{selectedAdminFreelancer.activityRegionCodes.map((code) => labelOf(regionMap, code)).join(', ') || '-'}</span></li>
                  <li><span>가능 시간대</span><span>{selectedAdminFreelancer.availableTimeSlotCodes.map((code) => labelOf(timeSlotMap, code)).join(', ') || '-'}</span></li>
                  <li><span>서비스 유형</span><span>{selectedAdminFreelancer.projectTypeCodes.map((code) => labelOf(projectTypeMap, code)).join(', ') || '-'}</span></li>
                </ul>
                <p className="admin-subtext">첨부 파일</p>
                {selectedAdminFreelancer.portfolioFiles.length === 0 ? (
                  <p className="empty-msg">등록된 첨부 파일이 없습니다.</p>
                ) : (
                  <ul className="admin-list">
                    {selectedAdminFreelancer.portfolioFiles.map((file) => (
                      <li key={file.fileId} className="admin-item">
                        <div>
                          <strong>{file.originalName}</strong>
                          <p className="admin-subtext">{formatDateTime(file.uploadedAt)}</p>
                        </div>
                        <div className="admin-item-right">
                          <button type="button" className="btn-edit" onClick={() => void handleFileView(file.viewUrl)}>보기</button>
                          <button type="button" className="btn-edit" onClick={() => void handleFileDownload(file.downloadUrl)}>다운로드</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && isAdmin && (
          <div className="tab-content">
            {adminLoadErrors.projects && <p className="login-error">{adminLoadErrors.projects}</p>}
            <ul className="admin-list">
              {adminProjects.map((project) => (
                <li key={project.projectId} className="admin-item">
                  <div>
                    <strong>{project.title}</strong>
                    <p className="admin-subtext">{project.owner.name} / {project.projectTypeCode}</p>
                  </div>
                  <div className="admin-item-right">
                    <span className="skill-tag">{projectStatusLabel(project.status)}</span>
                    <button className="btn-edit" onClick={() => void handleSelectAdminProject(project.projectId)}>상세</button>
                    <button className="btn-cancel" onClick={() => void handleCancelAdminProject(project.projectId)}>취소</button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedAdminProject && (
              <div className="account-card" style={{ marginTop: '1.5rem' }}>
                <h2>{selectedAdminProject.title}</h2>
                <ul className="account-info-list">
                  <li><span>상태</span><span>{projectStatusLabel(selectedAdminProject.status)}</span></li>
                  <li><span>작성자</span><span>{selectedAdminProject.owner.name}</span></li>
                  <li><span>지역</span><span>{labelOf(regionMap, selectedAdminProject.serviceRegionCode)}</span></li>
                  <li><span>주소</span><span>{selectedAdminProject.serviceAddress}</span></li>
                  <li><span>일정</span><span>{formatDateTime(selectedAdminProject.requestedStartAt)} ~ {formatDateTime(selectedAdminProject.requestedEndAt)}</span></li>
                  <li><span>수락 프리랜서</span><span>{selectedAdminProject.acceptedProposal?.freelancer.name || '-'}</span></li>
                  <li><span>취소 사유</span><span>{selectedAdminProject.cancelledReason || '-'}</span></li>
                </ul>
                <p className="review-content">{selectedAdminProject.requestDetail}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verify' && isAdmin && (
          <>
            {adminLoadErrors.verifications && <p className="login-error">{adminLoadErrors.verifications}</p>}
            <VerifyTab
              verifications={adminVerifications}
              verifyFilter={verifyFilter}
              setVerifyFilter={setVerifyFilter}
              selectedVerification={selectedAdminVerification}
              onSelectVerification={(verificationId) => void handleSelectAdminVerification(verificationId)}
              onApproveVerification={(verificationId) => void handleApproveVerification(verificationId)}
              onRejectVerification={(verificationId) => void handleRejectVerification(verificationId)}
              onViewFile={(fileUrl) => void handleFileView(fileUrl)}
              onDownloadFile={(fileUrl) => void handleFileDownload(fileUrl)}
            />
          </>
        )}

        {activeTab === 'reports' && isAdmin && (
          <>
            {adminReportLoadErrors.map((message) => (
              <p key={message} className="login-error">{message}</p>
            ))}
            <ReportsTab
              mode="admin"
              reviews={adminReviews}
              reports={adminReports}
              selectedReport={selectedAdminReport}
              onBlindToggle={(reviewId, blindedYn) => void handleAdminBlindToggle(reviewId, blindedYn)}
              onSelectReport={(reportId) => void handleSelectAdminReport(reportId)}
              onCloseReport={handleCloseAdminReport}
              onResolveReport={(reportId) => void handleResolveAdminReport(reportId)}
              onRejectReport={(reportId) => void handleRejectAdminReport(reportId)}
            />
          </>
        )}

        {activeTab === 'usage-report' && isAdmin && (
          <>
            {usageReportLoadErrors.map((message) => (
              <p key={message} className="login-error">{message}</p>
            ))}
            <UsageReportTab
              dashboard={adminDashboard}
              freelancers={adminFreelancers}
              projects={adminProjects}
              reviews={adminReviews}
              reports={adminReports}
            />
          </>
        )}
      </main>
    </div>
  );
}

