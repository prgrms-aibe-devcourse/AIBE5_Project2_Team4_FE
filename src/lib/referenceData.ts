import { getAvailableTimeSlotCodes, getProjectTypeCodes, getRegionCodes, type CodeLookupResponse } from '../api/codes';
import { getReviewTagCodes, type ReviewTagCodeResponse } from '../api/reviews';

type CodeMap = Map<string, string>;

let projectTypesPromise: Promise<CodeMap> | null = null;
let regionsPromise: Promise<CodeMap> | null = null;
let timeSlotsPromise: Promise<CodeMap> | null = null;
let reviewTagsPromise: Promise<CodeMap> | null = null;

function toCodeMap(items: Array<CodeLookupResponse | ReviewTagCodeResponse>): CodeMap {
  return new Map(items.map((item) => [item.code, item.name]));
}

export function loadProjectTypeMap(): Promise<CodeMap> {
  projectTypesPromise ??= getProjectTypeCodes().then(toCodeMap);
  return projectTypesPromise;
}

export function loadRegionMap(): Promise<CodeMap> {
  regionsPromise ??= getRegionCodes().then(toCodeMap);
  return regionsPromise;
}

export function loadTimeSlotMap(): Promise<CodeMap> {
  timeSlotsPromise ??= getAvailableTimeSlotCodes().then(toCodeMap);
  return timeSlotsPromise;
}

export function loadReviewTagMap(): Promise<CodeMap> {
  reviewTagsPromise ??= getReviewTagCodes().then(toCodeMap);
  return reviewTagsPromise;
}

export async function loadReferenceMaps(): Promise<{
  projectTypes: CodeMap;
  regions: CodeMap;
  timeSlots: CodeMap;
  reviewTags: CodeMap;
}> {
  const [projectTypes, regions, timeSlots, reviewTags] = await Promise.all([
    loadProjectTypeMap(),
    loadRegionMap(),
    loadTimeSlotMap(),
    loadReviewTagMap(),
  ]);

  return { projectTypes, regions, timeSlots, reviewTags };
}

function sidoPriority(name: string): number {
  if (name.includes('서울')) return 0;
  if (name.includes('경기')) return 1;
  if (name.includes('광역시')) return 2;
  if (name.includes('특별자치시')) return 3;
  if (name.includes('특별자치도')) return 4;
  return 5;
}

export function sortSido<T extends { name: string }>(regions: T[]): T[] {
  return [...regions].sort((a, b) => sidoPriority(a.name) - sidoPriority(b.name));
}

export function labelOf(map: CodeMap | null | undefined, code: string | null | undefined): string {
  if (!code) {
    return '-';
  }

  return map?.get(code) ?? code;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
