import { getRequestsPerMinuteSnapshot } from '@middleware/metrics.middleware';
import BlogPostModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import ContactMessageModel from '@models/ContactMessage.model';
import NewsletterSubscriberModel from '@models/NewsletterSubscriber.model';
import ProjectModel from '@models/Project.model';
import TestimonialModel from '@models/Testimonial.model';
import UserModel from '@models/User.model';
import { fetchActivitySummary, fetchRecentActivity } from '@services/activityLog.service';

const formatUptime = (uptimeSeconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(uptimeSeconds));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getAdminMetrics = async () => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    projectCount,
    certificateCount,
    blogCount,
    subscriberCount,
    testimonialCount,
    pendingContacts,
    userCount,
    recentActivity,
    activitySummary
  ] = await Promise.all([
    ProjectModel.countDocuments(),
    CertificateModel.countDocuments(),
    BlogPostModel.countDocuments({ published: true }),
    NewsletterSubscriberModel.countDocuments({ isConfirmed: true, unsubscribedAt: { $exists: false } }),
    TestimonialModel.countDocuments({ isApproved: true }),
    ContactMessageModel.countDocuments({ status: { $ne: 'resolved' } }),
    UserModel.countDocuments(),
    fetchRecentActivity(25),
    fetchActivitySummary(since24h)
  ]);

  return {
    requestsPerMinute: getRequestsPerMinuteSnapshot(),
    uptime: formatUptime(process.uptime()),
    totals: {
      projects: projectCount,
      certificates: certificateCount,
      blogPosts: blogCount,
      subscribers: subscriberCount,
      testimonials: testimonialCount,
      activeUsers: userCount,
      pendingContacts
    },
    recentActivity,
    activitySummary,
    generatedAt: Date.now()
  };
};
