import { AppError } from '@utils/helpers/error.helper';
import VisitorSessionModel, {
  type VisitorDeclaredIdentity,
  type IVisitorSession,
  type VisitorInferredProfile,
  type VisitorSegment,
  type VisitorSessionDocument
} from '@models/VisitorSession.model';
import VisitorAccessAccountModel, {
  type IVisitorAccessAccount
} from '@models/VisitorAccessAccount.model';
import { recordAnalyticsEvent } from '@services/analytics.service';
import { invalidateCachePrefix } from '@utils/cache/cache.service';
import {
  createVisitorSessionId,
  extractReferrerDomain,
  hashVisitorIp,
  normalizeVisitorLocale,
  normalizeVisitorPath,
  normalizeVisitorUtm,
  summarizeUserAgent,
  type VisitorUtmInput
} from '@utils/visitor/visitorSession.helper';
import type {
  RecordVisitorEventInput,
  VisitorEventTypeInput,
  VisitorIntelSessionsQueryInput
} from '@validators/visitor.validator';

const MAX_VISITED_PATHS = 12;
const DEFAULT_CONFIDENCE = 18;

type VisitorEventCountKey = keyof IVisitorSession['eventCounts'];

interface ResolveSessionSnapshotResult {
  gateRequired: boolean;
  session: VisitorSessionSnapshot | null;
  account: VisitorAccessAccountSnapshot | null;
}

interface UpsertVisitorSessionParams {
  segment: VisitorSegment;
  entryPath: string;
  locale?: string;
  referrer?: string;
  utm?: VisitorUtmInput;
  identity: VisitorDeclaredIdentity;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface RecordVisitorEventParams {
  sessionId?: string | null;
  locale?: string;
  referrer?: string;
  userAgent?: string | null;
  input: RecordVisitorEventInput;
}

interface AggregateBucket<TLabel extends string> {
  label: TLabel;
  count: number;
}

export interface VisitorSessionSnapshot {
  id: string;
  sessionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  selfDeclaredSegment?: VisitorSegment;
  identity?: {
    name: string;
    companyName?: string;
    purpose: string;
  };
  inferredProfile: VisitorInferredProfile;
  confidence: number;
  reasons: string[];
  landingPath: string;
  lastPath: string;
  pageCount: number;
  visitedPaths: string[];
  referrerDomain?: string;
  locale?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  eventCounts: IVisitorSession['eventCounts'];
  engagementScore: number;
  sourceLabel: string;
}

export interface VisitorAccessAccountSnapshot {
  id: string;
  sessionId: string;
  visitorSessionId: string;
  segment: VisitorSegment;
  identity: {
    name: string;
    companyName?: string;
    purpose: string;
  };
  status: 'active';
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorAccessContext {
  session: VisitorSessionSnapshot | null;
  account: VisitorAccessAccountSnapshot | null;
  viewerSegment?: VisitorSegment;
}

export interface VisitorIntelSummary {
  totals: {
    sessions: number;
    bySegment: Record<string, number>;
    byProfile: Record<string, number>;
    averageEngagementScore: number;
  };
  segmentDistribution: Array<AggregateBucket<string>>;
  inferredDistribution: Array<AggregateBucket<string>>;
  topLandingPaths: Array<AggregateBucket<string>>;
  topReferrers: Array<AggregateBucket<string>>;
}

export interface VisitorIntelSessionsResult {
  data: VisitorSessionSnapshot[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSourceLabel = (session: Pick<IVisitorSession, 'utm' | 'referrerDomain'>) =>
  session.utm?.source ?? session.referrerDomain ?? 'direct';

const eventTypeToCountKey: Record<VisitorEventTypeInput, VisitorEventCountKey> = {
  page_view: 'pageView',
  project_view: 'projectView',
  certificate_view: 'certificateView',
  blog_view: 'blogView',
  chat_open: 'chatOpen',
  chat_message: 'chatMessage',
  contact_click: 'contactClick',
  outbound_click: 'outboundClick'
};

const upsertVisitedPath = (paths: string[], path: string) => {
  const nextPaths = [path, ...paths.filter((entry) => entry !== path)];
  return nextPaths.slice(0, MAX_VISITED_PATHS);
};

const calculateEngagementScore = (session: Pick<IVisitorSession, 'eventCounts' | 'pageCount'>) => {
  const counts = session.eventCounts;

  const score =
    session.pageCount * 6 +
    counts.projectView * 10 +
    counts.certificateView * 7 +
    counts.blogView * 8 +
    counts.chatOpen * 12 +
    counts.chatMessage * 20 +
    counts.contactClick * 24 +
    counts.outboundClick * 10;

  return Math.min(100, score);
};

const inferProfile = (session: Pick<
  IVisitorSession,
  'selfDeclaredSegment' | 'referrerDomain' | 'utm' | 'eventCounts' | 'pageCount' | 'visitedPaths'
>) => {
  if (session.selfDeclaredSegment === 'company') {
    return {
      inferredProfile: 'corporate_like' as const,
      confidence: 98,
      reasons: ['Escolha manual: empresa']
    };
  }

  if (session.selfDeclaredSegment === 'recruiter') {
    return {
      inferredProfile: 'recruiter_like' as const,
      confidence: 98,
      reasons: ['Escolha manual: recrutador']
    };
  }

  const corporateReasons: string[] = [];
  const recruiterReasons: string[] = [];
  let corporateScore = 0;
  let recruiterScore = 0;

  const referrerDomain = session.referrerDomain?.toLowerCase();
  const utmSource = session.utm?.source?.toLowerCase();
  const utmMedium = session.utm?.medium?.toLowerCase();
  const allPaths = session.visitedPaths.map((path) => path.toLowerCase());

  if (referrerDomain?.includes('linkedin.com')) {
    recruiterScore += 28;
    recruiterReasons.push('Origem LinkedIn');
  }

  if (utmSource?.includes('linkedin') || utmSource?.includes('talent') || utmMedium?.includes('recruit')) {
    recruiterScore += 18;
    recruiterReasons.push('UTM com origem de recrutamento');
  }

  if (allPaths.some((path) => path.startsWith('/projects')) && session.pageCount >= 2) {
    corporateScore += 16;
    corporateReasons.push('Navegação focada em projetos');
  }

  if (session.eventCounts.chatMessage > 0) {
    corporateScore += 14;
    corporateReasons.push('Interação direta com o assistente');
  }

  if (session.eventCounts.contactClick > 0) {
    corporateScore += 24;
    corporateReasons.push('Clique em contato comercial');
  }

  if (session.eventCounts.outboundClick > 0) {
    corporateScore += 8;
    corporateReasons.push('Ações externas relevantes');
  }

  if (
    referrerDomain &&
    !['google.com', 'www.google.com', 'github.com', 'www.github.com', 'instagram.com', 'www.instagram.com'].includes(
      referrerDomain
    ) &&
    !referrerDomain.includes('linkedin.com')
  ) {
    corporateScore += 10;
    corporateReasons.push('Referrer externo não-social');
  }

  if (recruiterScore > corporateScore && recruiterScore >= 20) {
    return {
      inferredProfile: 'recruiter_like' as const,
      confidence: Math.min(92, recruiterScore + DEFAULT_CONFIDENCE),
      reasons: recruiterReasons
    };
  }

  if (corporateScore >= 20) {
    return {
      inferredProfile: 'corporate_like' as const,
      confidence: Math.min(92, corporateScore + DEFAULT_CONFIDENCE),
      reasons: corporateReasons
    };
  }

  return {
    inferredProfile: 'general' as const,
    confidence: DEFAULT_CONFIDENCE,
    reasons:
      session.selfDeclaredSegment === 'visitor'
        ? ['Escolha manual: visitante']
        : ['Sem sinais fortes de perfil corporativo ou recrutamento']
  };
};

const applyDerivedFields = (session: VisitorSessionDocument) => {
  const inference = inferProfile(session);
  session.inferredProfile = inference.inferredProfile;
  session.confidence = inference.confidence;
  session.reasons = inference.reasons;
  session.engagementScore = calculateEngagementScore(session);
};

const serializeSession = (session: Pick<
  IVisitorSession & { _id?: unknown },
  | '_id'
  | 'sessionId'
  | 'firstSeenAt'
  | 'lastSeenAt'
  | 'selfDeclaredSegment'
  | 'identity'
  | 'inferredProfile'
  | 'confidence'
  | 'reasons'
  | 'landingPath'
  | 'lastPath'
  | 'pageCount'
  | 'visitedPaths'
  | 'referrerDomain'
  | 'locale'
  | 'utm'
  | 'eventCounts'
  | 'engagementScore'
>) : VisitorSessionSnapshot => ({
  id: String(session._id ?? session.sessionId),
  sessionId: session.sessionId,
  firstSeenAt: new Date(session.firstSeenAt).toISOString(),
  lastSeenAt: new Date(session.lastSeenAt).toISOString(),
  selfDeclaredSegment: session.selfDeclaredSegment,
  identity: session.identity
    ? {
        name: session.identity.name,
        companyName: session.identity.companyName,
        purpose: session.identity.purpose
      }
    : undefined,
  inferredProfile: session.inferredProfile,
  confidence: session.confidence,
  reasons: [...session.reasons],
  landingPath: session.landingPath,
  lastPath: session.lastPath,
  pageCount: session.pageCount,
  visitedPaths: [...session.visitedPaths],
  referrerDomain: session.referrerDomain,
  locale: session.locale,
  utm: session.utm,
  eventCounts: session.eventCounts,
  engagementScore: session.engagementScore,
  sourceLabel: buildSourceLabel(session)
});

const serializeAccessAccount = (account: Pick<
  IVisitorAccessAccount & { _id?: unknown },
  'sessionId' | 'visitorSessionId' | 'segment' | 'identity' | 'status' | 'lastSeenAt' | 'createdAt' | 'updatedAt' | '_id'
>): VisitorAccessAccountSnapshot => ({
  id: String(account._id ?? account.sessionId),
  sessionId: account.sessionId,
  visitorSessionId: String(account.visitorSessionId),
  segment: account.segment,
  identity: {
    name: account.identity.name,
    companyName: account.identity.companyName,
    purpose: account.identity.purpose
  },
  status: account.status,
  lastSeenAt: new Date(account.lastSeenAt).toISOString(),
  createdAt: new Date(account.createdAt).toISOString(),
  updatedAt: new Date(account.updatedAt).toISOString()
});

const createEmptyEventCounts = () => ({
  pageView: 0,
  projectView: 0,
  certificateView: 0,
  blogView: 0,
  chatOpen: 0,
  chatMessage: 0,
  contactClick: 0,
  outboundClick: 0
});

const normalizeDeclaredIdentity = (
  segment: VisitorSegment,
  identity: VisitorDeclaredIdentity
): VisitorDeclaredIdentity => ({
  name: identity.name.trim(),
  companyName:
    segment === 'visitor'
      ? undefined
      : identity.companyName?.trim()
        ? identity.companyName.trim()
        : undefined,
  purpose: identity.purpose.trim()
});

const hasDeclaredIdentity = (
  session: Pick<IVisitorSession, 'selfDeclaredSegment' | 'identity'>
) => {
  if (!session.selfDeclaredSegment || !session.identity) {
    return false;
  }

  const hasName = session.identity.name.trim().length > 0;
  const hasPurpose = session.identity.purpose.trim().length > 0;

  if (!hasName || !hasPurpose) {
    return false;
  }

  if (session.selfDeclaredSegment === 'visitor') {
    return true;
  }

  return Boolean(session.identity.companyName?.trim());
};

const getSessionById = async (sessionId?: string | null) => {
  if (!sessionId) {
    return null;
  }

  return VisitorSessionModel.findOne({ sessionId });
};

const getAccessAccountBySessionId = async (sessionId?: string | null) => {
  if (!sessionId) {
    return null;
  }

  return VisitorAccessAccountModel.findOne({ sessionId });
};

const syncAccessAccountFromSession = async (
  session: Pick<IVisitorSession & { _id?: unknown }, 'sessionId' | 'selfDeclaredSegment' | 'identity' | 'lastSeenAt' | '_id'>
) => {
  if (!session.selfDeclaredSegment || !session.identity || !session._id) {
    return null;
  }

  const account = await VisitorAccessAccountModel.findOneAndUpdate(
    { sessionId: session.sessionId },
    {
      $set: {
        visitorSessionId: session._id,
        segment: session.selfDeclaredSegment,
        identity: session.identity,
        status: 'active',
        lastSeenAt: session.lastSeenAt
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  return serializeAccessAccount(account);
};

const invalidateAudienceSensitivePublicCaches = async () => {
  await Promise.all([
    invalidateCachePrefix('projects:'),
    invalidateCachePrefix('certificates:'),
    invalidateCachePrefix('blog:'),
    invalidateCachePrefix('highlights:'),
    invalidateCachePrefix('search:')
  ]);
};

export const getVisitorSessionSnapshot = async (
  sessionId?: string | null
): Promise<ResolveSessionSnapshotResult> => {
  const session = await getSessionById(sessionId);

  if (!session || !hasDeclaredIdentity(session)) {
    return {
      gateRequired: true,
      session: null,
      account: null
    };
  }

  const account = await syncAccessAccountFromSession(session);

  return {
    gateRequired: false,
    session: serializeSession(session),
    account
  };
};

export const resolveVisitorAccessContext = async (
  sessionId?: string | null
): Promise<VisitorAccessContext> => {
  const session = await getSessionById(sessionId);

  if (!session || !hasDeclaredIdentity(session)) {
    return {
      session: null,
      account: null,
      viewerSegment: undefined
    };
  }

  const account =
    (await getAccessAccountBySessionId(session.sessionId)) ?? (await VisitorAccessAccountModel.findOne({ sessionId: session.sessionId }));
  const serializedAccount = account ? serializeAccessAccount(account) : await syncAccessAccountFromSession(session);

  return {
    session: serializeSession(session),
    account: serializedAccount,
    viewerSegment: serializedAccount?.segment ?? session.selfDeclaredSegment
  };
};

export const upsertVisitorSession = async ({
  segment,
  entryPath,
  locale,
  referrer,
  utm,
  identity,
  sessionId,
  ipAddress,
  userAgent
}: UpsertVisitorSessionParams) => {
  const now = new Date();
  const normalizedPath = normalizeVisitorPath(entryPath);
  const normalizedLocale = normalizeVisitorLocale(locale);
  const normalizedUtm = normalizeVisitorUtm(utm);
  const normalizedIdentity = normalizeDeclaredIdentity(segment, identity);
  const referrerDomain = extractReferrerDomain(referrer);
  const ipHash = hashVisitorIp(ipAddress);
  const summarizedAgent = summarizeUserAgent(userAgent);

  const existingSession = await getSessionById(sessionId);
  const session =
    existingSession ??
    new VisitorSessionModel({
      sessionId: createVisitorSessionId(),
      firstSeenAt: now,
      lastSeenAt: now,
      landingPath: normalizedPath,
      lastPath: normalizedPath,
      pageCount: 0,
      visitedPaths: [],
      eventCounts: createEmptyEventCounts()
    });

  session.selfDeclaredSegment = segment;
  session.identity = normalizedIdentity;
  session.lastSeenAt = now;
  session.lastPath = normalizedPath;
  session.locale = normalizedLocale ?? session.locale;
  session.referrerDomain = referrerDomain ?? session.referrerDomain;
  session.utm = normalizedUtm ?? session.utm;
  session.ipHash = ipHash ?? session.ipHash;
  session.userAgent = summarizedAgent ?? session.userAgent;

  applyDerivedFields(session);
  await session.save();
  const account = await syncAccessAccountFromSession(session);
  await invalidateAudienceSensitivePublicCaches();

  await recordAnalyticsEvent({
    type: 'visitor_segment_selected',
    locale: normalizedLocale,
    referrer,
    userAgent: summarizedAgent,
    visitorSessionId: session.sessionId,
    eventPayload: {
      eventType: 'visitor_segment_selected',
      segment,
      entryPath: normalizedPath,
      source: buildSourceLabel(session)
    }
  });

  return {
    session: serializeSession(session),
    account
  };
};

export const recordVisitorEvent = async ({
  sessionId,
  locale,
  referrer,
  userAgent,
  input
}: RecordVisitorEventParams) => {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new AppError(
      'Visitor session is required before tracking events.',
      400,
      undefined,
      true,
      'visitor_session_required'
    );
  }

  const now = new Date();
  const normalizedPath = normalizeVisitorPath(input.path);
  const countKey = eventTypeToCountKey[input.type];

  session.lastSeenAt = now;
  session.lastPath = normalizedPath;
  session.locale = normalizeVisitorLocale(locale) ?? session.locale;
  session.eventCounts[countKey] += 1;

  if (input.type === 'page_view') {
    session.pageCount += 1;
    session.visitedPaths = upsertVisitedPath(session.visitedPaths, normalizedPath);
  } else if (
    input.type === 'project_view' ||
    input.type === 'certificate_view' ||
    input.type === 'blog_view' ||
    input.type === 'chat_open' ||
    input.type === 'chat_message' ||
    input.type === 'contact_click' ||
    input.type === 'outbound_click'
  ) {
    session.visitedPaths = upsertVisitedPath(session.visitedPaths, normalizedPath);
  }

  applyDerivedFields(session);
  await session.save();
  await VisitorAccessAccountModel.findOneAndUpdate(
    { sessionId: session.sessionId },
    {
      $set: {
        lastSeenAt: session.lastSeenAt
      }
    }
  );

  await recordAnalyticsEvent({
    type: input.type,
    locale: normalizeVisitorLocale(locale),
    referrer,
    userAgent: summarizeUserAgent(userAgent),
    visitorSessionId: session.sessionId,
    eventPayload: {
      path: normalizedPath,
      contentType: input.contentType,
      contentKey: input.contentKey,
      meta: input.meta,
      source: buildSourceLabel(session)
    }
  });

  return serializeSession(session);
};

export const getVisitorIntelSummary = async (): Promise<VisitorIntelSummary> => {
  const [totalSessions, averageEngagement, segmentDistributionRaw, inferredDistributionRaw, topLandingPathsRaw, topReferrersRaw] =
    await Promise.all([
      VisitorSessionModel.countDocuments(),
      VisitorSessionModel.aggregate<{ _id: null; value: number }>([
        {
          $group: {
            _id: null,
            value: { $avg: '$engagementScore' }
          }
        }
      ]),
      VisitorSessionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $ifNull: ['$selfDeclaredSegment', 'unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      VisitorSessionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$inferredProfile', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      VisitorSessionModel.aggregate<{ _id: string; count: number }>([
        { $match: { landingPath: { $exists: true, $ne: '' } } },
        { $group: { _id: '$landingPath', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 }
      ]),
      VisitorSessionModel.aggregate<{ _id: string; count: number }>([
        { $match: { referrerDomain: { $exists: true, $ne: '' } } },
        { $group: { _id: '$referrerDomain', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 }
      ])
    ]);

  const segmentDistribution = segmentDistributionRaw.map((item) => ({
    label: item._id,
    count: item.count
  }));
  const inferredDistribution = inferredDistributionRaw.map((item) => ({
    label: item._id,
    count: item.count
  }));
  const topLandingPaths = topLandingPathsRaw.map((item) => ({
    label: item._id,
    count: item.count
  }));
  const topReferrers = topReferrersRaw.map((item) => ({
    label: item._id,
    count: item.count
  }));

  return {
    totals: {
      sessions: totalSessions,
      bySegment: Object.fromEntries(segmentDistribution.map((item) => [item.label, item.count])),
      byProfile: Object.fromEntries(inferredDistribution.map((item) => [item.label, item.count])),
      averageEngagementScore: Number((averageEngagement[0]?.value ?? 0).toFixed(1))
    },
    segmentDistribution,
    inferredDistribution,
    topLandingPaths,
    topReferrers
  };
};

export const getVisitorIntelSessions = async (
  query: VisitorIntelSessionsQueryInput
): Promise<VisitorIntelSessionsResult> => {
  const filter: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (query.segment) {
    filter.selfDeclaredSegment = query.segment;
  }

  if (query.profile) {
    filter.inferredProfile = query.profile;
  }

  if (query.path) {
    const regex = new RegExp(escapeRegExp(query.path), 'i');
    andClauses.push({
      $or: [{ landingPath: regex }, { lastPath: regex }, { visitedPaths: regex }]
    });
  }

  if (query.source) {
    const regex = new RegExp(escapeRegExp(query.source), 'i');
    andClauses.push({
      $or: [{ referrerDomain: regex }, { 'utm.source': regex }, { 'utm.medium': regex }, { 'utm.campaign': regex }]
    });
  }

  if (andClauses.length > 0) {
    filter.$and = andClauses;
  }

  const page = Math.max(1, query.page);
  const limit = Math.max(1, query.limit);
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    VisitorSessionModel.find(filter).sort({ lastSeenAt: -1 }).skip(skip).limit(limit).lean(),
    VisitorSessionModel.countDocuments(filter)
  ]);

  return {
    data: sessions.map((session) => serializeSession(session)),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};
